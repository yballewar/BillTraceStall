using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.Exceptions;
using BillTraceStall.Domain.Entities;
using BillTraceStall.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.Infrastructure.Services;

public sealed class BillingService : IBillingService
{
    private readonly IUnitOfWork _uow;

    public BillingService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task GenerateMonthlyBillsAsync(int month, int year, CancellationToken ct)
    {
        if (month is < 1 or > 12)
        {
            throw new AppException("Invalid month.", 400);
        }

        var start = new DateTimeOffset(new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc));
        var end = start.AddMonths(1);

        var deliveredOrders = await _uow.Orders.Query()
            .Where(x => x.Status == OrderStatus.Delivered
                        && x.OrderTime >= start
                        && x.OrderTime < end
                        && !x.PaymentReceived)
            .Select(x => new { x.Id, x.OfficeId, x.StallId })
            .ToListAsync(ct);

        if (deliveredOrders.Count == 0)
        {
            return;
        }

        var orderIds = deliveredOrders.Select(x => x.Id).ToList();
        var items = await _uow.OrderItems.Query()
            .Where(x => orderIds.Contains(x.OrderId))
            .Select(x => new { x.OrderId, x.Quantity, x.Price })
            .ToListAsync(ct);

        var totalsByOffice = deliveredOrders
            .GroupBy(x => new { x.OfficeId, x.StallId })
            .Select(g =>
            {
                var orderIdSet = g.Select(x => x.Id).ToHashSet();
                var total = items.Where(i => orderIdSet.Contains(i.OrderId)).Sum(i => i.Price * i.Quantity);
                return new { g.Key.OfficeId, g.Key.StallId, Total = total };
            })
            .ToList();

        foreach (var entry in totalsByOffice)
        {
            var existing = await _uow.Bills.Query()
                .FirstOrDefaultAsync(x => x.OfficeId == entry.OfficeId && x.Month == month && x.Year == year, ct);

            if (existing is null)
            {
                await _uow.Bills.AddAsync(new Bill
                {
                    StallId = entry.StallId,
                    OfficeId = entry.OfficeId,
                    Month = month,
                    Year = year,
                    TotalAmount = entry.Total,
                    Status = BillStatus.Unpaid,
                    GeneratedAt = DateTimeOffset.UtcNow
                }, ct);
            }
            else
            {
                if (existing.Status == BillStatus.Paid)
                {
                    continue;
                }

                existing.TotalAmount = entry.Total;
                existing.GeneratedAt = DateTimeOffset.UtcNow;
                _uow.Bills.Update(existing);
            }
        }

        await _uow.SaveChangesAsync(ct);
    }
}
