using System.Data;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Domain.Entities;
using BillTraceStall.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.Infrastructure.Services;

public sealed class OrderNumberGenerator : IOrderNumberGenerator
{
    private readonly BillTraceDbContext _db;

    public OrderNumberGenerator(BillTraceDbContext db)
    {
        _db = db;
    }

    public async Task<string> GenerateAsync(Guid stallId, DateTimeOffset orderTime, CancellationToken ct)
    {
        var day = DateOnly.FromDateTime(orderTime.UtcDateTime);

        var strategy = _db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            for (var attempt = 0; attempt < 3; attempt++)
            {
                await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
                try
                {
                    var counter = await _db.OrderDailyCounters.FirstOrDefaultAsync(x => x.StallId == stallId && x.OrderDate == day, ct);
                    long next;

                    if (counter is null)
                    {
                        var start = new DateTimeOffset(new DateTime(day.Year, day.Month, day.Day, 0, 0, 0, DateTimeKind.Utc));
                        var end = start.AddDays(1);

                        var serials = await _db.Orders
                            .Where(x => x.StallId == stallId && x.OrderTime >= start && x.OrderTime < end)
                            .Select(x => x.OrderNumber)
                            .Where(x => x != null && x.Length > 8)
                            .Select(x => x.Substring(8))
                            .ToListAsync(ct);

                        var maxExisting = serials
                            .Select(x => long.TryParse(x, out var v) ? v : 0L)
                            .DefaultIfEmpty(0L)
                            .Max();

                        next = maxExisting + 1;

                        _db.OrderDailyCounters.Add(new OrderDailyCounter
                        {
                            StallId = stallId,
                            OrderDate = day,
                            LastNumber = next
                        });
                    }
                    else
                    {
                        next = counter.LastNumber + 1;
                        counter.LastNumber = next;
                    }

                    await _db.SaveChangesAsync(ct);
                    await tx.CommitAsync(ct);

                    var serial = next.ToString().PadLeft(6, '0');
                    return $"{day:yyyyMMdd}{serial}";
                }
                catch (DbUpdateException) when (attempt < 2)
                {
                    await tx.RollbackAsync(ct);
                }
            }

            throw new InvalidOperationException("Failed to generate order number.");
        });
    }
}
