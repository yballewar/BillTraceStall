using System.Security.Claims;
using System.Linq;
using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.DTOs.Delivery;
using BillTraceStall.Application.Exceptions;
using BillTraceStall.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/stall")]
[ApiVersion("1.0")]
[Authorize(Policy = "TeaStallOwner")]
public sealed class TeaStallDashboardController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly ITeaStallService _stallService;
    private readonly INotificationService _notifications;
    private readonly IRealtimeService _realtime;

    public TeaStallDashboardController(IUnitOfWork uow, ITeaStallService stallService, INotificationService notifications, IRealtimeService realtime)
    {
        _uow = uow;
        _stallService = stallService;
        _notifications = notifications;
        _realtime = realtime;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> Profile(CancellationToken ct)
    {
        var stall = await GetStallAsync(ct);
        return Ok(new
        {
            id = stall.Id,
            stallName = stall.StallName,
            address = stall.Address,
            city = stall.City,
            state = stall.State,
            pincode = stall.Pincode,
            uniqueCode = stall.UniqueCode,
            isApproved = stall.IsApproved,
            isActive = stall.IsActive
        });
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
        var (start, end) = GetMonthRange(month, year);
        var stall = await GetStallAsync(ct);

        var menuCount = await _uow.MenuItems.Query().CountAsync(x => x.StallId == stall.Id && x.IsActive, ct);
        var officeCount = await _uow.Offices.Query().CountAsync(x => x.StallId == stall.Id, ct);
        var deliveryBoyCount = await _uow.DeliveryBoys.Query().CountAsync(x => x.StallId == stall.Id, ct);

        var orders = await _uow.Orders.Query()
            .Where(x => x.StallId == stall.Id && x.OrderTime >= start && x.OrderTime < end)
            .Select(x => new { x.Id, x.Status })
            .ToListAsync(ct);

        var orderIds = orders.Select(x => x.Id).ToList();
        var items = orderIds.Count == 0
            ? new List<(Guid OrderId, int Quantity, decimal Price)>()
            : await _uow.OrderItems.Query()
                .Where(x => orderIds.Contains(x.OrderId))
                .Select(x => new ValueTuple<Guid, int, decimal>(x.OrderId, x.Quantity, x.Price))
                .ToListAsync(ct);

        var totalAmount = items.Sum(x => x.Item2 * x.Item3);
        var deliveredCount = orders.Count(x => x.Status == OrderStatus.Delivered);
        var pendingCount = orders.Count(x => x.Status == OrderStatus.Pending);
        var preparingCount = orders.Count(x => x.Status == OrderStatus.Preparing);
        var cancelledCount = orders.Count(x => x.Status == OrderStatus.Cancelled);

        return Ok(new
        {
            month,
            year,
            stall = new { id = stall.Id, stallName = stall.StallName, uniqueCode = stall.UniqueCode, isApproved = stall.IsApproved },
            counts = new
            {
                offices = officeCount,
                menuItems = menuCount,
                deliveryBoys = deliveryBoyCount,
                orders = orders.Count,
                delivered = deliveredCount,
                pending = pendingCount,
                preparing = preparingCount,
                cancelled = cancelledCount
            },
            totalAmount
        });
    }

    [HttpGet("menu")]
    public async Task<IActionResult> Menu(CancellationToken ct)
    {
        var stall = await GetStallAsync(ct);
        var items = await _uow.MenuItems.Query()
            .Where(x => x.StallId == stall.Id)
            .OrderBy(x => x.Category)
            .ThenBy(x => x.ItemName)
            .Select(x => new { id = x.Id, itemName = x.ItemName, price = x.Price, category = x.Category, isActive = x.IsActive })
            .ToListAsync(ct);

        return Ok(new { items });
    }

    [HttpGet("delivery-boys")]
    public async Task<IActionResult> DeliveryBoys(CancellationToken ct)
    {
        var stall = await GetStallAsync(ct);
        var items = await _uow.DeliveryBoys.Query()
            .Where(x => x.StallId == stall.Id)
            .OrderBy(x => x.Name)
            .Select(x => new { id = x.Id, name = x.Name, phone = x.Phone, createdAt = x.CreatedAt })
            .ToListAsync(ct);

        return Ok(new { items });
    }

    [HttpPost("delivery-boys")]
    public async Task<IActionResult> AddDeliveryBoy([FromBody] CreateDeliveryBoyRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var id = await _stallService.AddDeliveryBoyAsync(userId, request, ct);
        return Ok(new { id });
    }

    [HttpPut("delivery-boys/{id:guid}")]
    public async Task<IActionResult> UpdateDeliveryBoy(Guid id, [FromBody] UpdateDeliveryBoyRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        await _stallService.UpdateDeliveryBoyAsync(userId, id, request, ct);
        return Ok();
    }

    [HttpGet("orders")]
    public async Task<IActionResult> Orders([FromQuery] string? status, CancellationToken ct)
    {
        var stall = await GetStallAsync(ct);

        OrderStatus? st = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OrderStatus>(status, ignoreCase: true, out var parsed))
        {
            st = parsed;
        }

        var q = _uow.Orders.Query()
            .Where(x => x.StallId == stall.Id && x.OrderType != OrderType.Scheduled);
        if (st is not null)
        {
            if (st == OrderStatus.Ready)
            {
                q = q.Where(x => x.Status == OrderStatus.Ready || x.Status == OrderStatus.Pickup);
            }
            else
            {
                q = q.Where(x => x.Status == st);
            }
        }

        var orders = await q
            .OrderByDescending(x => x.OrderTime)
            .Take(100)
            .Join(_uow.Offices.Query(), o => o.OfficeId, of => of.Id, (o, of) => new { o, of })
            .Select(x => new
            {
                id = x.o.Id,
                orderNumber = x.o.OrderNumber,
                status = x.o.Status.ToString(),
                orderTime = x.o.OrderTime,
                office = new { id = x.of.Id, name = x.of.OfficeName, contactPerson = x.of.ContactPerson, phone = x.of.Phone, address = x.of.Address },
                deliveryBoyId = x.o.DeliveryBoyId,
                paymentReceived = x.o.PaymentReceived,
                paymentMode = x.o.PaymentMode.ToString()
            })
            .ToListAsync(ct);

        var orderIds = orders.Select(x => x.id).ToList();
        var items = orderIds.Count == 0
            ? []
            : await _uow.OrderItems.Query()
                .Where(x => orderIds.Contains(x.OrderId))
                .Join(_uow.MenuItems.Query(), oi => oi.MenuItemId, mi => mi.Id, (oi, mi) => new
                {
                    orderId = oi.OrderId,
                    menuItemId = mi.Id,
                    itemName = mi.ItemName,
                    category = mi.Category,
                    quantity = oi.Quantity,
                    price = oi.Price
                })
                .ToListAsync(ct);

        var grouped = orders.Select(o => new
        {
            o.id,
            o.orderNumber,
            o.status,
            o.orderTime,
            o.office,
            o.deliveryBoyId,
            o.paymentReceived,
            o.paymentMode,
            items = items.Where(i => i.orderId == o.id).ToList()
        });

        return Ok(new { items = grouped });
    }

    [HttpGet("report/daily")]
    public async Task<IActionResult> DailyReport([FromQuery] string? date, CancellationToken ct)
    {
        var stall = await GetStallAsync(ct);

        var day = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!string.IsNullOrWhiteSpace(date))
        {
            if (!DateOnly.TryParse(date, out day))
            {
                return BadRequest(new { error = "Invalid date. Use YYYY-MM-DD." });
            }
        }

        var start = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(1);

        var orderRows = await _uow.Orders.Query()
            .Where(x => x.StallId == stall.Id
                        && x.Status == OrderStatus.Delivered
                        && x.OrderTime >= start
                        && x.OrderTime < end)
            .Join(_uow.Offices.Query(), o => o.OfficeId, of => of.Id, (o, of) => new
            {
                o.Id,
                o.OfficeId,
                OfficeName = of.OfficeName,
                OfficePhone = of.Phone,
                o.DeliveryBoyId,
                o.PaymentReceived,
                o.PaymentMode
            })
            .ToListAsync(ct);

        var orderIds = orderRows.Select(x => x.Id).ToList();
        var itemRows = orderIds.Count == 0
            ? []
            : await _uow.OrderItems.Query()
                .Where(x => orderIds.Contains(x.OrderId))
                .Join(_uow.MenuItems.Query(), oi => oi.MenuItemId, mi => mi.Id, (oi, mi) => new
                {
                    oi.OrderId,
                    mi.Id,
                    mi.ItemName,
                    mi.Category,
                    oi.Quantity,
                    Amount = oi.Quantity * oi.Price
                })
                .ToListAsync(ct);

        var amountByOrder = itemRows
            .GroupBy(x => x.OrderId)
            .ToDictionary(g => g.Key, g => new
            {
                Qty = g.Sum(v => v.Quantity),
                Amount = g.Sum(v => v.Amount)
            });

        var officeWise = orderRows
            .GroupBy(x => new { x.OfficeId, x.OfficeName, x.OfficePhone })
            .Select(g =>
            {
                var ids = g.Select(v => v.Id).ToHashSet();
                var totalQty = itemRows.Where(i => ids.Contains(i.OrderId)).Sum(i => i.Quantity);
                var totalAmount = itemRows.Where(i => ids.Contains(i.OrderId)).Sum(i => i.Amount);
                var cashAmount = g.Where(v => v.PaymentReceived).Select(v => amountByOrder.TryGetValue(v.Id, out var a) ? a.Amount : 0m).Sum();
                var creditAmount = g.Where(v => !v.PaymentReceived).Select(v => amountByOrder.TryGetValue(v.Id, out var a) ? a.Amount : 0m).Sum();
                return new
                {
                    officeId = g.Key.OfficeId,
                    officeName = g.Key.OfficeName,
                    phone = g.Key.OfficePhone,
                    orders = g.Select(v => v.Id).Distinct().Count(),
                    qty = totalQty,
                    amount = totalAmount,
                    cashAmount,
                    creditAmount
                };
            })
            .OrderByDescending(x => x.amount)
            .ToList();

        var itemWise = itemRows
            .GroupBy(x => x.Id)
            .Select(g => new
            {
                menuItemId = g.Key,
                itemName = g.First().ItemName,
                category = g.First().Category,
                qty = g.Sum(v => v.Quantity),
                amount = g.Sum(v => v.Amount)
            })
            .OrderByDescending(x => x.qty)
            .ToList();

        var deliveryBoyIds = orderRows.Where(x => x.DeliveryBoyId != null).Select(x => x.DeliveryBoyId!.Value).Distinct().ToList();
        var deliveryBoys = deliveryBoyIds.Count == 0
            ? []
            : await _uow.DeliveryBoys.Query()
                .Where(x => deliveryBoyIds.Contains(x.Id))
                .Select(x => new { x.Id, x.Name, x.Phone })
                .ToListAsync(ct);

        var deliveryWise = orderRows
            .GroupBy(x => x.DeliveryBoyId)
            .Select(g =>
            {
                var ids = g.Select(v => v.Id).ToList();
                var totalAmount = ids.Select(id => amountByOrder.TryGetValue(id, out var a) ? a.Amount : 0m).Sum();
                var collected = g.Where(v => v.PaymentReceived).Select(v => amountByOrder.TryGetValue(v.Id, out var a) ? a.Amount : 0m).Sum();
                var credit = g.Where(v => !v.PaymentReceived).Select(v => amountByOrder.TryGetValue(v.Id, out var a) ? a.Amount : 0m).Sum();
                var meta = g.Key is null ? null : deliveryBoys.FirstOrDefault(x => x.Id == g.Key.Value);
                return new
                {
                    deliveryBoyId = g.Key,
                    name = meta?.Name ?? "Unassigned",
                    phone = meta?.Phone ?? "",
                    orders = ids.Distinct().Count(),
                    saleAmount = totalAmount,
                    cashCollected = collected,
                    creditAmount = credit
                };
            })
            .OrderByDescending(x => x.saleAmount)
            .ToList();

        var cashSale = orderRows.Where(x => x.PaymentReceived).Select(x => amountByOrder.TryGetValue(x.Id, out var a) ? a.Amount : 0m).Sum();
        var creditSale = orderRows.Where(x => !x.PaymentReceived).Select(x => amountByOrder.TryGetValue(x.Id, out var a) ? a.Amount : 0m).Sum();

        return Ok(new
        {
            date = day.ToString("yyyy-MM-dd"),
            totals = new
            {
                totalOrders = orderRows.Select(x => x.Id).Distinct().Count(),
                totalQty = itemRows.Sum(x => x.Quantity),
                totalAmount = itemRows.Sum(x => x.Amount),
                cashSale,
                creditSale
            },
            byOffice = officeWise,
            byItem = itemWise,
            byDeliveryBoy = deliveryWise
        });
    }

    [HttpGet("report/monthly-summary")]
    [HttpGet("report/day-wise-summary")]
    public async Task<IActionResult> MonthlySummary([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
        if (year < 2000 || year > 2100 || month < 1 || month > 12)
        {
            return BadRequest(new { error = "Invalid year/month." });
        }

        var (start, end) = GetMonthRange(month, year);
        var stall = await GetStallAsync(ct);

        var orders = await _uow.Orders.Query()
            .Where(x => x.StallId == stall.Id
                        && x.Status == OrderStatus.Delivered
                        && x.OrderTime >= start
                        && x.OrderTime < end)
            .Select(x => new { x.Id, x.OrderTime, x.PaymentReceived })
            .ToListAsync(ct);

        var orderIds = orders.Select(x => x.Id).ToList();
        var amountByOrder = orderIds.Count == 0
            ? new Dictionary<Guid, decimal>()
            : await _uow.OrderItems.Query()
                .Where(x => orderIds.Contains(x.OrderId))
                .GroupBy(x => x.OrderId)
                .Select(g => new { OrderId = g.Key, Amount = g.Sum(v => v.Quantity * v.Price) })
                .ToDictionaryAsync(x => x.OrderId, x => x.Amount, ct);

        var byDate = orders
            .GroupBy(x => DateOnly.FromDateTime(x.OrderTime.UtcDateTime))
            .Select(g =>
            {
                var ids = g.Select(v => v.Id).ToList();
                var bill = ids.Select(id => amountByOrder.TryGetValue(id, out var a) ? a : 0m).Sum();
                var cash = g.Where(v => v.PaymentReceived).Select(v => amountByOrder.TryGetValue(v.Id, out var a) ? a : 0m).Sum();
                var credit = bill - cash;
                return new
                {
                    date = g.Key.ToString("yyyy-MM-dd"),
                    billAmount = bill,
                    cash,
                    credit
                };
            })
            .OrderBy(x => x.date)
            .ToList();

        return Ok(new
        {
            month = $"{year:D4}-{month:D2}",
            rows = byDate,
            totals = new
            {
                billAmount = byDate.Sum(x => x.billAmount),
                cash = byDate.Sum(x => x.cash),
                credit = byDate.Sum(x => x.credit)
            }
        });
    }

    [HttpGet("report/office-wise-summary")]
    public async Task<IActionResult> OfficeWiseSummary([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
        if (year < 2000 || year > 2100 || month < 1 || month > 12)
        {
            return BadRequest(new { error = "Invalid year/month." });
        }

        var (start, end) = GetMonthRange(month, year);
        var stall = await GetStallAsync(ct);

        var orders = await _uow.Orders.Query()
            .Where(x => x.StallId == stall.Id
                        && x.Status == OrderStatus.Delivered
                        && x.OrderTime >= start
                        && x.OrderTime < end)
            .Join(_uow.Offices.Query(), o => o.OfficeId, of => of.Id, (o, of) => new
            {
                o.Id,
                o.OrderTime,
                o.PaymentReceived,
                OfficeId = of.Id,
                OfficeName = of.OfficeName
            })
            .ToListAsync(ct);

        var orderIds = orders.Select(x => x.Id).ToList();
        var amountByOrder = orderIds.Count == 0
            ? new Dictionary<Guid, decimal>()
            : await _uow.OrderItems.Query()
                .Where(x => orderIds.Contains(x.OrderId))
                .GroupBy(x => x.OrderId)
                .Select(g => new { OrderId = g.Key, Amount = g.Sum(v => v.Quantity * v.Price) })
                .ToDictionaryAsync(x => x.OrderId, x => x.Amount, ct);

        var rows = orders
            .GroupBy(x => new { Date = DateOnly.FromDateTime(x.OrderTime.UtcDateTime), x.OfficeId, x.OfficeName })
            .Select(g =>
            {
                var ids = g.Select(v => v.Id).ToList();
                var amount = ids.Select(id => amountByOrder.TryGetValue(id, out var a) ? a : 0m).Sum();
                var cashAmount = g.Where(v => v.PaymentReceived).Select(v => amountByOrder.TryGetValue(v.Id, out var a) ? a : 0m).Sum();
                var creditAmount = amount - cashAmount;
                return new
                {
                    date = g.Key.Date.ToString("yyyy-MM-dd"),
                    officeId = g.Key.OfficeId,
                    officeName = g.Key.OfficeName,
                    cashAmount,
                    creditAmount,
                    amount
                };
            })
            .OrderBy(x => x.date)
            .ThenBy(x => x.officeName)
            .ToList();

        return Ok(new
        {
            month = $"{year:D4}-{month:D2}",
            rows,
            totals = new { amount = rows.Sum(x => x.amount) }
        });
    }

    [HttpGet("report/daily/delivery-orders")]
    public async Task<IActionResult> DeliveryOrdersReport([FromQuery] string date, [FromQuery] Guid? deliveryBoyId, CancellationToken ct)
    {
        var stall = await GetStallAsync(ct);

        if (!DateOnly.TryParse(date, out var day))
        {
            return BadRequest(new { error = "Invalid date. Use YYYY-MM-DD." });
        }

        if (deliveryBoyId is not null)
        {
            var exists = await _uow.DeliveryBoys.Query().AnyAsync(x => x.Id == deliveryBoyId.Value && x.StallId == stall.Id, ct);
            if (!exists)
            {
                return NotFound(new { error = "Delivery boy not found." });
            }
        }

        var start = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(1);

        var orders = await _uow.Orders.Query()
            .Where(x => x.StallId == stall.Id
                        && x.Status == OrderStatus.Delivered
                        && x.OrderTime >= start
                        && x.OrderTime < end
                        && (deliveryBoyId == null ? x.DeliveryBoyId == null : x.DeliveryBoyId == deliveryBoyId.Value))
            .Join(_uow.Offices.Query(), o => o.OfficeId, of => of.Id, (o, of) => new
            {
                o.Id,
                o.OrderNumber,
                o.OrderTime,
                Office = new { id = of.Id, name = of.OfficeName, phone = of.Phone, address = of.Address },
                o.PaymentReceived,
                PaymentMode = o.PaymentMode.ToString(),
                o.DeliveryBoyId
            })
            .OrderBy(x => x.OrderTime)
            .ToListAsync(ct);

        var orderIds = orders.Select(x => x.Id).ToList();
        var itemRows = orderIds.Count == 0
            ? []
            : await _uow.OrderItems.Query()
                .Where(x => orderIds.Contains(x.OrderId))
                .Join(_uow.MenuItems.Query(), oi => oi.MenuItemId, mi => mi.Id, (oi, mi) => new
                {
                    oi.OrderId,
                    menuItemId = mi.Id,
                    itemName = mi.ItemName,
                    category = mi.Category,
                    quantity = oi.Quantity,
                    price = oi.Price,
                    amount = oi.Price * oi.Quantity
                })
                .ToListAsync(ct);

        var mapped = orders.Select(o =>
        {
            var items = itemRows.Where(i => i.OrderId == o.Id).ToList();
            return new
            {
                id = o.Id,
                orderNumber = o.OrderNumber,
                orderTime = o.OrderTime,
                office = o.Office,
                paymentReceived = o.PaymentReceived,
                paymentMode = o.PaymentMode,
                amount = items.Sum(x => x.amount),
                items = items.Select(x => new { x.menuItemId, x.itemName, x.category, x.quantity, x.price, x.amount }).ToList()
            };
        }).ToList();

        var deliveryMeta = deliveryBoyId is null
            ? null
            : await _uow.DeliveryBoys.Query()
                .Where(x => x.Id == deliveryBoyId.Value)
                .Select(x => new { id = x.Id, name = x.Name, phone = x.Phone })
                .FirstOrDefaultAsync(ct);

        return Ok(new
        {
            date = day.ToString("yyyy-MM-dd"),
            deliveryBoy = deliveryBoyId is null
                ? new { id = (Guid?)null, name = "Unassigned", phone = "" }
                : new { id = (Guid?)deliveryMeta!.id, deliveryMeta.name, deliveryMeta.phone },
            totalOrders = mapped.Count,
            totalAmount = mapped.Sum(x => x.amount),
            orders = mapped
        });
    }

    [HttpGet("report/daily/office-orders")]
    public async Task<IActionResult> OfficeOrdersReport([FromQuery] string date, [FromQuery] Guid officeId, CancellationToken ct)
    {
        var stall = await GetStallAsync(ct);

        if (!DateOnly.TryParse(date, out var day))
        {
            return BadRequest(new { error = "Invalid date. Use YYYY-MM-DD." });
        }

        var office = await _uow.Offices.Query()
            .Where(x => x.Id == officeId && x.StallId == stall.Id)
            .Select(x => new { x.Id, name = x.OfficeName, x.Phone, x.Address })
            .FirstOrDefaultAsync(ct);

        if (office is null)
        {
            return NotFound(new { error = "Office not found." });
        }

        var start = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(1);

        var orders = await _uow.Orders.Query()
            .Where(x => x.StallId == stall.Id
                        && x.OfficeId == office.Id
                        && x.Status == OrderStatus.Delivered
                        && x.OrderTime >= start
                        && x.OrderTime < end)
            .Select(o => new
            {
                o.Id,
                o.OrderNumber,
                o.OrderTime,
                o.PaymentReceived,
                PaymentMode = o.PaymentMode.ToString(),
                o.DeliveryBoyId
            })
            .OrderBy(o => o.OrderTime)
            .ToListAsync(ct);

        var orderIds = orders.Select(x => x.Id).ToList();
        var itemRows = orderIds.Count == 0
            ? []
            : await _uow.OrderItems.Query()
                .Where(x => orderIds.Contains(x.OrderId))
                .Join(_uow.MenuItems.Query(), oi => oi.MenuItemId, mi => mi.Id, (oi, mi) => new
                {
                    oi.OrderId,
                    menuItemId = mi.Id,
                    itemName = mi.ItemName,
                    category = mi.Category,
                    quantity = oi.Quantity,
                    price = oi.Price,
                    amount = oi.Price * oi.Quantity
                })
                .ToListAsync(ct);

        var deliveryBoyIds = orders.Where(x => x.DeliveryBoyId != null).Select(x => x.DeliveryBoyId!.Value).Distinct().ToList();
        var deliveryBoys = deliveryBoyIds.Count == 0
            ? []
            : await _uow.DeliveryBoys.Query()
                .Where(x => deliveryBoyIds.Contains(x.Id))
                .Select(x => new { x.Id, x.Name })
                .ToListAsync(ct);

        var mapped = orders.Select(o =>
        {
            var items = itemRows.Where(i => i.OrderId == o.Id).ToList();
            var deliveryName = o.DeliveryBoyId is null ? "" : (deliveryBoys.FirstOrDefault(x => x.Id == o.DeliveryBoyId.Value)?.Name ?? "");
            return new
            {
                id = o.Id,
                orderNumber = o.OrderNumber,
                orderTime = o.OrderTime,
                paymentReceived = o.PaymentReceived,
                paymentMode = o.PaymentMode,
                deliveryBoyId = o.DeliveryBoyId,
                deliveryBoyName = deliveryName,
                amount = items.Sum(x => x.amount),
                items = items.Select(x => new { x.menuItemId, x.itemName, x.category, x.quantity, x.price, x.amount }).ToList()
            };
        }).ToList();

        return Ok(new
        {
            date = day.ToString("yyyy-MM-dd"),
            office,
            totalOrders = mapped.Count,
            totalAmount = mapped.Sum(x => x.amount),
            orders = mapped
        });
    }

    [HttpPost("orders/{orderId:guid}/payment-status")]
    public async Task<IActionResult> UpdatePaymentStatus(Guid orderId, [FromBody] UpdatePaymentStatusRequest request, CancellationToken ct)
    {
        var stall = await GetStallAsync(ct);
        var order = await _uow.Orders.Query().FirstOrDefaultAsync(x => x.Id == orderId && x.StallId == stall.Id, ct);
        if (order is null)
        {
            throw new AppException("Order not found.", 404);
        }

        if (order.Status != OrderStatus.Delivered)
        {
            throw new AppException("Only delivered orders can update payment status.", 400);
        }

        Enum.TryParse<PaymentMode>(request.PaymentMode, true, out var parsedMode);
        order.PaymentMode = parsedMode;
        order.PaymentReceived = request.PaymentReceived;
        if (order.PaymentReceived)
        {
            order.PaymentReceivedAt = DateTimeOffset.UtcNow;
            if (order.PaymentMode != PaymentMode.Cash)
            {
                order.PaymentMode = PaymentMode.Cash;
            }
        }
        else
        {
            order.PaymentReceivedAt = null;
            order.PaymentMode = PaymentMode.Credit;
        }

        _uow.Orders.Update(order);
        await _uow.SaveChangesAsync(ct);

        var officeUserId = await _uow.Offices.Query()
            .Where(x => x.Id == order.OfficeId)
            .Select(x => x.OfficeUserId)
            .FirstOrDefaultAsync(ct);

        var deliveryUserIds = await _uow.DeliveryBoys.Query()
            .Where(x => x.StallId == stall.Id)
            .Select(x => x.DeliveryUserId)
            .ToListAsync(ct);

        await _realtime.SendOrderEventToUsersAsync(
            new OrderRealtimeEvent(
                Type: "payment_changed",
                OrderId: order.Id,
                Status: order.Status.ToString(),
                StallId: order.StallId,
                OfficeId: order.OfficeId,
                DeliveryBoyId: order.DeliveryBoyId
            ),
            deliveryUserIds.Concat(new[] { officeUserId, stall.OwnerId }),
            ct
        );

        return Ok();
    }

    public sealed record UpdatePaymentStatusRequest(bool PaymentReceived, string PaymentMode = "Cash");

    [HttpPost("orders/{orderId:guid}/ready")]
    public async Task<IActionResult> MarkReady(Guid orderId, CancellationToken ct)
    {
        var stall = await GetStallAsync(ct);
        var order = await _uow.Orders.Query().FirstOrDefaultAsync(x => x.Id == orderId && x.StallId == stall.Id, ct);
        if (order is null)
        {
            throw new AppException("Order not found.", 404);
        }

        if (order.Status == OrderStatus.Ready || order.Status == OrderStatus.Pickup)
        {
            return Ok();
        }

        if (order.Status is not (OrderStatus.Pending or OrderStatus.Preparing))
        {
            throw new AppException("Only pending/preparing orders can be marked ready.", 400);
        }

        order.Status = OrderStatus.Ready;
        _uow.Orders.Update(order);
        await _uow.SaveChangesAsync(ct);

        var deliveryUserIds = await _uow.DeliveryBoys.Query()
            .Where(x => x.StallId == stall.Id)
            .Select(x => x.DeliveryUserId)
            .ToListAsync(ct);

        await _notifications.SendToUsersAsync(deliveryUserIds, "Order Ready", "A new order is ready for pickup.", ct);

        var officeUserId = await _uow.Offices.Query()
            .Where(x => x.Id == order.OfficeId)
            .Select(x => x.OfficeUserId)
            .FirstOrDefaultAsync(ct);

        if (officeUserId != Guid.Empty)
        {
            await _notifications.SendToUserAsync(officeUserId, "Order Status", "Your order is Ready.", ct);
        }

        await _realtime.SendOrderEventToUsersAsync(
            new OrderRealtimeEvent(
                Type: "status_changed",
                OrderId: order.Id,
                Status: order.Status.ToString(),
                StallId: order.StallId,
                OfficeId: order.OfficeId,
                DeliveryBoyId: order.DeliveryBoyId
            ),
            deliveryUserIds.Concat(new[] { officeUserId, stall.OwnerId }),
            ct
        );

        return Ok();
    }

    [HttpPost("orders/{orderId:guid}/preparing")]
    public async Task<IActionResult> MarkPreparing(Guid orderId, CancellationToken ct)
    {
        var stall = await GetStallAsync(ct);
        var order = await _uow.Orders.Query().FirstOrDefaultAsync(x => x.Id == orderId && x.StallId == stall.Id, ct);
        if (order is null)
        {
            throw new AppException("Order not found.", 404);
        }

        if (order.Status == OrderStatus.Preparing)
        {
            return Ok();
        }

        if (order.Status != OrderStatus.Pending)
        {
            throw new AppException("Only pending orders can be marked preparing.", 400);
        }

        order.Status = OrderStatus.Preparing;
        _uow.Orders.Update(order);
        await _uow.SaveChangesAsync(ct);

        var officeUserId = await _uow.Offices.Query()
            .Where(x => x.Id == order.OfficeId)
            .Select(x => x.OfficeUserId)
            .FirstOrDefaultAsync(ct);

        if (officeUserId != Guid.Empty)
        {
            await _notifications.SendToUserAsync(officeUserId, "Order Status", "Your order is Preparing.", ct);
        }

        await _realtime.SendOrderEventToUsersAsync(
            new OrderRealtimeEvent(
                Type: "status_changed",
                OrderId: order.Id,
                Status: order.Status.ToString(),
                StallId: order.StallId,
                OfficeId: order.OfficeId,
                DeliveryBoyId: order.DeliveryBoyId
            ),
            new[] { officeUserId, stall.OwnerId },
            ct
        );

        return Ok();
    }

    private async Task<BillTraceStall.Domain.Entities.TeaStall> GetStallAsync(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.OwnerId == userId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found. Create tea stall profile first.", 404);
        }

        return stall;
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
}
