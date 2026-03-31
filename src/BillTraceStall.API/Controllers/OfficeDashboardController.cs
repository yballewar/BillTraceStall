using System.Security.Claims;
using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.Exceptions;
using BillTraceStall.API.Services;
using BillTraceStall.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/office")]
[ApiVersion("1.0")]
[Authorize(Policy = "Office")]
public sealed class OfficeDashboardController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public OfficeDashboardController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard([FromQuery] int month, [FromQuery] int year, [FromQuery] Guid? officeId, CancellationToken ct)
    {
        var (start, end) = GetMonthRange(month, year);
        var office = await GetOfficeAsync(officeId, ct);
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == office.StallId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        var rows = await _uow.OrderItems.Query()
            .Join(_uow.Orders.Query(), oi => oi.OrderId, o => o.Id, (oi, o) => new { oi, o })
            .Join(_uow.MenuItems.Query(), x => x.oi.MenuItemId, mi => mi.Id, (x, mi) => new
            {
                x.o.Id,
                x.o.OfficeId,
                x.o.Status,
                x.o.OrderTime,
                mi.Category,
                mi.ItemName,
                Qty = x.oi.Quantity,
                Amount = x.oi.Quantity * x.oi.Price
            })
            .Where(x => x.OfficeId == office.Id && x.OrderTime >= start && x.OrderTime < end && x.Status != OrderStatus.Cancelled)
            .Select(x => new
            {
                OrderId = x.Id,
                x.OrderTime.Year,
                x.OrderTime.Month,
                x.OrderTime.Day,
                x.Category,
                x.ItemName,
                x.Qty,
                x.Amount
            })
            .ToListAsync(ct);

        var days = rows
            .GroupBy(r => new DateOnly(r.Year, r.Month, r.Day))
            .OrderByDescending(g => g.Key)
            .Select(g =>
            {
                var orderCount = g.Select(x => x.OrderId).Distinct().Count();
                var teaQty = g.Where(x => IsTea(x.Category, x.ItemName)).Sum(x => x.Qty);
                var coffeeQty = g.Where(x => IsCoffee(x.Category, x.ItemName)).Sum(x => x.Qty);
                var totalQty = g.Sum(x => x.Qty);
                var totalAmount = g.Sum(x => x.Amount);
                return new
                {
                    Date = g.Key.ToString("yyyy-MM-dd"),
                    OrderCount = orderCount,
                    TeaQty = teaQty,
                    CoffeeQty = coffeeQty,
                    TotalQty = totalQty,
                    TotalAmount = totalAmount
                };
            })
            .ToList();

        return Ok(new
        {
            month,
            year,
            office = new { id = office.Id, officeName = office.OfficeName, stallId = stall.Id, stallName = stall.StallName, stallCode = stall.UniqueCode },
            days
        });
    }

    [HttpGet("item-wise")]
    public async Task<IActionResult> ItemWise([FromQuery] int month, [FromQuery] int year, [FromQuery] Guid? officeId, CancellationToken ct)
    {
        var (start, end) = GetMonthRange(month, year);
        var office = await GetOfficeAsync(officeId, ct);
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == office.StallId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        var rows = await _uow.OrderItems.Query()
            .Join(_uow.Orders.Query(), oi => oi.OrderId, o => o.Id, (oi, o) => new { oi, o })
            .Join(_uow.MenuItems.Query(), x => x.oi.MenuItemId, mi => mi.Id, (x, mi) => new
            {
                x.o.OfficeId,
                x.o.Status,
                x.o.OrderTime,
                mi.ItemName,
                mi.Category,
                Qty = x.oi.Quantity,
                Amount = x.oi.Quantity * x.oi.Price
            })
            .Where(x => x.OfficeId == office.Id && x.OrderTime >= start && x.OrderTime < end && x.Status == OrderStatus.Delivered)
            .Select(x => new
            {
                x.OrderTime.Year,
                x.OrderTime.Month,
                x.OrderTime.Day,
                x.ItemName,
                x.Category,
                x.Qty,
                x.Amount
            })
            .ToListAsync(ct);

        var data = rows
            .GroupBy(r => new DateOnly(r.Year, r.Month, r.Day))
            .OrderByDescending(g => g.Key)
            .Select(g => new
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                Items = g.GroupBy(x => new { x.ItemName, x.Category })
                    .OrderBy(x => x.Key.ItemName)
                    .Select(x => new
                    {
                        x.Key.ItemName,
                        x.Key.Category,
                        Qty = x.Sum(v => v.Qty),
                        Amount = x.Sum(v => v.Amount)
                    })
                    .ToList()
            })
            .ToList();

        return Ok(new
        {
            month,
            year,
            office = new { id = office.Id, officeName = office.OfficeName, stallId = stall.Id, stallName = stall.StallName, stallCode = stall.UniqueCode },
            days = data
        });
    }

    [HttpGet("payments")]
    public async Task<IActionResult> Payments([FromQuery] int month, [FromQuery] int year, [FromQuery] Guid? officeId, CancellationToken ct)
    {
        var (start, end) = GetMonthRange(month, year);
        var office = await GetOfficeAsync(officeId, ct);
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == office.StallId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        var payments = await _uow.Payments.Query()
            .Join(_uow.Bills.Query(), p => p.BillId, b => b.Id, (p, b) => new { p, b })
            .Where(x => x.b.OfficeId == office.Id && x.b.Month == month && x.b.Year == year)
            .Select(x => new
            {
                x.p.Id,
                x.p.Amount,
                Status = x.p.PaymentStatus.ToString(),
                x.p.PaymentGateway,
                x.p.TransactionId,
                x.p.CreatedAt,
                x.p.PaidAt
            })
            .OrderByDescending(x => x.PaidAt ?? x.CreatedAt)
            .ToListAsync(ct);

        var totalPaid = payments
            .Where(x => string.Equals(x.Status, PaymentStatus.Success.ToString(), StringComparison.OrdinalIgnoreCase))
            .Sum(x => x.Amount);

        var bill = await _uow.Bills.Query()
            .Where(x => x.OfficeId == office.Id && x.Month == month && x.Year == year)
            .Select(x => new { x.TotalAmount, Status = x.Status.ToString() })
            .FirstOrDefaultAsync(ct);

        var pendingOrderIds = await _uow.Orders.Query()
            .Where(x => x.OfficeId == office.Id
                        && x.OrderTime >= start
                        && x.OrderTime < end
                        && x.Status == OrderStatus.Delivered
                        && !x.PaymentReceived)
            .Select(x => x.Id)
            .Distinct()
            .ToListAsync(ct);

        var pendingOrders = pendingOrderIds.Count;
        var computedPendingTotal = pendingOrders == 0
            ? 0m
            : await _uow.OrderItems.Query()
                .Where(x => pendingOrderIds.Contains(x.OrderId))
                .Select(x => x.Price * x.Quantity)
                .SumAsync(ct);

        var billTotal = bill is null ? computedPendingTotal : bill.TotalAmount;

        return Ok(new
        {
            month,
            year,
            office = new { id = office.Id, officeName = office.OfficeName, stallId = stall.Id, stallName = stall.StallName, stallCode = stall.UniqueCode },
            billTotal,
            totalPaid,
            balance = billTotal - totalPaid,
            pendingOrders,
            billStatus = bill?.Status ?? "NotGenerated",
            payments
        });
    }

    [HttpGet("invoice")]
    public async Task<IActionResult> Invoice([FromQuery] int month, [FromQuery] int year, [FromQuery] Guid? officeId, CancellationToken ct)
    {
        var (start, end) = GetMonthRange(month, year);
        var office = await GetOfficeAsync(officeId, ct);
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == office.StallId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        var orders = await _uow.Orders.Query()
            .Where(x => x.OfficeId == office.Id
                        && x.OrderTime >= start
                        && x.OrderTime < end
                        && x.Status == OrderStatus.Delivered
                        && !x.PaymentReceived)
            .Select(x => x.Id)
            .ToListAsync(ct);

        var rows = orders.Count == 0
            ? []
            : await _uow.OrderItems.Query()
                .Where(x => orders.Contains(x.OrderId))
                .Join(_uow.MenuItems.Query(), oi => oi.MenuItemId, mi => mi.Id, (oi, mi) => new
                {
                    mi.ItemName,
                    mi.Category,
                    oi.Quantity,
                    Amount = oi.Quantity * oi.Price
                })
                .ToListAsync(ct);

        var items = rows
            .GroupBy(x => new { x.ItemName, x.Category })
            .Select(g => new InvoicePdf.InvoiceItemRow(
                ItemName: g.Key.ItemName,
                Category: g.Key.Category,
                Quantity: g.Sum(x => x.Quantity),
                Amount: g.Sum(x => x.Amount)
            ))
            .OrderByDescending(x => x.Quantity)
            .ToList();

        var totals = new InvoicePdf.InvoiceTotals(
            TotalOrders: orders.Distinct().Count(),
            TotalQty: rows.Sum(x => x.Quantity),
            TotalAmount: rows.Sum(x => x.Amount)
        );

        var header = new InvoicePdf.InvoiceHeader(
            StallName: stall.StallName,
            StallCode: stall.UniqueCode,
            OfficeName: office.OfficeName,
            OfficePhone: office.Phone,
            PeriodLabel: $"{year}-{month:00}"
        );

        var pdf = InvoicePdf.Render(header, items, totals);
        var fileName = $"invoice-{stall.UniqueCode}-{office.UniqueCode}-{year}-{month:00}.pdf";
        return File(pdf, "application/pdf", fileName);
    }

    [HttpGet("report/day-wise.pdf")]
    public async Task<IActionResult> DayWiseReportPdf([FromQuery] int month, [FromQuery] int year, [FromQuery] Guid? officeId, CancellationToken ct)
    {
        var (start, end) = GetMonthRange(month, year);
        var office = await GetOfficeAsync(officeId, ct);
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == office.StallId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        var rows = await _uow.OrderItems.Query()
            .Join(_uow.Orders.Query(), oi => oi.OrderId, o => o.Id, (oi, o) => new { oi, o })
            .Where(x => x.o.OfficeId == office.Id && x.o.OrderTime >= start && x.o.OrderTime < end && x.o.Status != OrderStatus.Cancelled)
            .Select(x => new
            {
                x.o.Id,
                x.o.OrderTime.Year,
                x.o.OrderTime.Month,
                x.o.OrderTime.Day,
                Amount = x.oi.Quantity * x.oi.Price
            })
            .ToListAsync(ct);

        var data = rows
            .GroupBy(r => new DateOnly(r.Year, r.Month, r.Day))
            .OrderByDescending(g => g.Key)
            .Select(g => new
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                Amount = g.Sum(x => x.Amount)
            })
            .ToList();

        var title = "Day Wise Order List";
        var period = $"{year}-{month:00}";
        var pdf = RenderSimpleTablePdf(
            title: title,
            subtitle: $"{stall.StallName} • {period}",
            columns: ["Date", "Stall Name", "Amount"],
            rows: data.Select(d => new[] { d.Date, stall.StallName, $"{d.Amount:0.##}" }).ToList(),
            rightAlignColumns: new HashSet<int> { 2 }
        );

        return File(pdf, "application/pdf", $"office-report-day-wise-{stall.UniqueCode}-{period}.pdf");
    }

    [HttpGet("report/item-wise.pdf")]
    public async Task<IActionResult> ItemWiseReportPdf([FromQuery] int month, [FromQuery] int year, [FromQuery] Guid? officeId, CancellationToken ct)
    {
        var (start, end) = GetMonthRange(month, year);
        var office = await GetOfficeAsync(officeId, ct);
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == office.StallId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        var rows = await _uow.OrderItems.Query()
            .Join(_uow.Orders.Query(), oi => oi.OrderId, o => o.Id, (oi, o) => new { oi, o })
            .Join(_uow.MenuItems.Query(), x => x.oi.MenuItemId, mi => mi.Id, (x, mi) => new
            {
                x.o.OfficeId,
                x.o.Status,
                x.o.OrderTime,
                mi.ItemName,
                mi.Category,
                Qty = x.oi.Quantity,
                Amount = x.oi.Quantity * x.oi.Price
            })
            .Where(x => x.OfficeId == office.Id && x.OrderTime >= start && x.OrderTime < end && x.Status == OrderStatus.Delivered)
            .Select(x => new
            {
                x.OrderTime.Year,
                x.OrderTime.Month,
                x.OrderTime.Day,
                x.ItemName,
                x.Category,
                x.Qty,
                x.Amount
            })
            .ToListAsync(ct);

        var flat = rows
            .GroupBy(r => new DateOnly(r.Year, r.Month, r.Day))
            .OrderByDescending(g => g.Key)
            .SelectMany(g =>
                g.GroupBy(x => new { x.ItemName, x.Category })
                    .OrderBy(x => x.Key.ItemName)
                    .Select(x => new
                    {
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        x.Key.ItemName,
                        x.Key.Category,
                        Qty = x.Sum(v => v.Qty),
                        Amount = x.Sum(v => v.Amount)
                    })
            )
            .ToList();

        var title = "Item Wise Sale";
        var period = $"{year}-{month:00}";
        var pdf = RenderSimpleTablePdf(
            title: title,
            subtitle: $"{stall.StallName} • {period}",
            columns: ["Date", "Item Name", "Quantity", "Amount"],
            rows: flat.Select(d => new[] { d.Date, d.ItemName, d.Qty.ToString(), $"{d.Amount:0.##}" }).ToList(),
            rightAlignColumns: new HashSet<int> { 2, 3 }
        );

        return File(pdf, "application/pdf", $"office-report-item-wise-{stall.UniqueCode}-{period}.pdf");
    }

    [HttpGet("report/pending-payments.pdf")]
    public async Task<IActionResult> PendingPaymentsPdf([FromQuery] int month, [FromQuery] int year, [FromQuery] Guid? officeId, CancellationToken ct)
    {
        var office = await GetOfficeAsync(officeId, ct);
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == office.StallId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        var bill = await _uow.Bills.Query()
            .Where(x => x.OfficeId == office.Id && x.Month == month && x.Year == year)
            .Select(x => new { x.TotalAmount })
            .FirstOrDefaultAsync(ct);

        var payments = await _uow.Payments.Query()
            .Join(_uow.Bills.Query(), p => p.BillId, b => b.Id, (p, b) => new { p, b })
            .Where(x => x.b.OfficeId == office.Id && x.b.Month == month && x.b.Year == year)
            .Select(x => new { x.p.Amount, Status = x.p.PaymentStatus.ToString() })
            .ToListAsync(ct);

        var totalPaid = payments
            .Where(x => string.Equals(x.Status, PaymentStatus.Success.ToString(), StringComparison.OrdinalIgnoreCase))
            .Sum(x => x.Amount);

        var billTotal = bill?.TotalAmount ?? 0m;
        var balance = billTotal - totalPaid;
        if (balance < 0) balance = 0;

        var title = "Pending Payment List";
        var period = $"{year}-{month:00}";
        var pdf = RenderSimpleTablePdf(
            title: title,
            subtitle: $"{stall.StallName} • {period}",
            columns: ["Stall Name", "Month Bill", "Amount"],
            rows: balance <= 0 ? [] : new List<string[]> { new[] { stall.StallName, period, $"{balance:0.##}" } },
            rightAlignColumns: new HashSet<int> { 2 }
        );

        return File(pdf, "application/pdf", $"office-report-pending-payments-{stall.UniqueCode}-{period}.pdf");
    }

    [HttpGet("report/paid-payments.pdf")]
    public async Task<IActionResult> PaidPaymentsPdf([FromQuery] int month, [FromQuery] int year, [FromQuery] Guid? officeId, CancellationToken ct)
    {
        var office = await GetOfficeAsync(officeId, ct);
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == office.StallId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        var payments = await _uow.Payments.Query()
            .Join(_uow.Bills.Query(), p => p.BillId, b => b.Id, (p, b) => new { p, b })
            .Where(x => x.b.OfficeId == office.Id && x.b.Month == month && x.b.Year == year)
            .Select(x => new { x.p.Amount, Status = x.p.PaymentStatus.ToString() })
            .ToListAsync(ct);

        var totalPaid = payments
            .Where(x => string.Equals(x.Status, PaymentStatus.Success.ToString(), StringComparison.OrdinalIgnoreCase))
            .Sum(x => x.Amount);

        var title = "Paid Payment List";
        var period = $"{year}-{month:00}";
        var pdf = RenderSimpleTablePdf(
            title: title,
            subtitle: $"{stall.StallName} • {period}",
            columns: ["Stall Name", "Month Bill", "Amount"],
            rows: totalPaid <= 0 ? [] : new List<string[]> { new[] { stall.StallName, period, $"{totalPaid:0.##}" } },
            rightAlignColumns: new HashSet<int> { 2 }
        );

        return File(pdf, "application/pdf", $"office-report-paid-payments-{stall.UniqueCode}-{period}.pdf");
    }

    private static byte[] RenderSimpleTablePdf(string title, string subtitle, IReadOnlyList<string> columns, IReadOnlyList<string[]> rows, HashSet<int> rightAlignColumns)
    {
        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text(title).FontSize(18).SemiBold();
                    col.Item().Text(subtitle).FontColor(Colors.Grey.Darken1);
                });

                page.Content().PaddingTop(16).Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        for (var i = 0; i < columns.Count; i++)
                        {
                            cols.RelativeColumn(1);
                        }
                    });

                    table.Header(h =>
                    {
                        for (var i = 0; i < columns.Count; i++)
                        {
                            var idx = i;
                            var cell = h.Cell().Element(HeaderCell);
                            if (rightAlignColumns.Contains(idx))
                            {
                                cell.AlignRight().Text(columns[idx]);
                            }
                            else
                            {
                                cell.Text(columns[idx]);
                            }
                        }
                    });

                    foreach (var r in rows)
                    {
                        for (var i = 0; i < columns.Count; i++)
                        {
                            var idx = i;
                            var cell = table.Cell().Element(BodyCell);
                            var v = idx < r.Length ? r[idx] : "";
                            if (rightAlignColumns.Contains(idx))
                            {
                                cell.AlignRight().Text(v);
                            }
                            else
                            {
                                cell.Text(v);
                            }
                        }
                    }

                    if (rows.Count == 0)
                    {
                        table.Cell().ColumnSpan((uint)columns.Count).Element(BodyCell).Text("No data.");
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Generated ").FontColor(Colors.Grey.Medium);
                    x.Span(DateTimeOffset.UtcNow.ToString("yyyy-MM-dd HH:mm")).FontColor(Colors.Grey.Medium);
                });
            });
        });

        return doc.GeneratePdf();
    }

    private static IContainer HeaderCell(IContainer container)
    {
        return container
            .DefaultTextStyle(x => x.SemiBold())
            .PaddingVertical(6)
            .PaddingHorizontal(6)
            .Background(Colors.Grey.Lighten3)
            .BorderBottom(1)
            .BorderColor(Colors.Grey.Lighten1);
    }

    private static IContainer BodyCell(IContainer container)
    {
        return container
            .PaddingVertical(6)
            .PaddingHorizontal(6)
            .BorderBottom(1)
            .BorderColor(Colors.Grey.Lighten3);
    }

    private async Task<BillTraceStall.Domain.Entities.Office> GetOfficeAsync(Guid? officeId, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var query = _uow.Offices.Query().Where(x => x.OfficeUserId == userId);

        BillTraceStall.Domain.Entities.Office? office;
        if (officeId is not null && officeId != Guid.Empty)
        {
            office = await query.FirstOrDefaultAsync(x => x.Id == officeId.Value, ct);
        }
        else
        {
            office = await query.OrderByDescending(x => x.CreatedAt).FirstOrDefaultAsync(ct);
        }

        if (office is null)
        {
            throw new AppException("Office profile not found. Join a stall first.", 404);
        }

        return office;
    }

    private static (DateTimeOffset start, DateTimeOffset end) GetMonthRange(int month, int year)
    {
        if (month is < 1 or > 12)
        {
            throw new AppException("Invalid month.", 400);
        }

        if (year is < 2000 or > 2100)
        {
            throw new AppException("Invalid year.", 400);
        }

        var start = new DateTimeOffset(new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc));
        return (start, start.AddMonths(1));
    }

    private static bool IsTea(string category, string itemName)
    {
        return category.Contains("tea", StringComparison.OrdinalIgnoreCase)
               || itemName.Contains("tea", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsCoffee(string category, string itemName)
    {
        return category.Contains("coffee", StringComparison.OrdinalIgnoreCase)
               || itemName.Contains("coffee", StringComparison.OrdinalIgnoreCase);
    }
}
