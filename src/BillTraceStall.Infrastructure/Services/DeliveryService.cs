using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.Exceptions;
using BillTraceStall.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace BillTraceStall.Infrastructure.Services;

public sealed class DeliveryService : IDeliveryService
{
    private readonly IUnitOfWork _uow;
    private readonly INotificationService _notifications;
    private readonly IRealtimeService _realtime;

    public DeliveryService(IUnitOfWork uow, INotificationService notifications, IRealtimeService realtime)
    {
        _uow = uow;
        _notifications = notifications;
        _realtime = realtime;
    }

    public async Task<List<object>> GetTodayDeliveriesAsync(Guid deliveryUserId, DateOnly today, CancellationToken ct)
    {
        var deliveryBoy = await _uow.DeliveryBoys.Query().FirstOrDefaultAsync(x => x.DeliveryUserId == deliveryUserId, ct);
        if (deliveryBoy is null)
        {
            throw new AppException("Delivery profile not found.", 404);
        }

        var start = today.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(1);

        var data = await _uow.Orders.Query()
            .Where(x => x.DeliveryBoyId == deliveryBoy.Id && x.OrderTime >= start && x.OrderTime < end)
            .Join(_uow.Offices.Query(), o => o.OfficeId, of => of.Id, (o, of) => new
            {
                o.Id,
                o.OrderNumber,
                o.Status,
                o.OrderTime,
                Office = new { of.OfficeName, of.Address, of.Phone, of.ContactPerson }
            })
            .ToListAsync(ct);

        return data.Cast<object>().ToList();
    }

    public async Task<List<object>> GetAvailableReadyOrdersAsync(Guid deliveryUserId, DateOnly today, CancellationToken ct)
    {
        var deliveryBoy = await _uow.DeliveryBoys.Query().FirstOrDefaultAsync(x => x.DeliveryUserId == deliveryUserId, ct);
        if (deliveryBoy is null)
        {
            throw new AppException("Delivery profile not found.", 404);
        }

        var start = today.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(1);

        var data = await _uow.Orders.Query()
            .Where(x => x.StallId == deliveryBoy.StallId
                        && x.Status == OrderStatus.Ready
                        && x.DeliveryBoyId == null
                        && x.OrderTime >= start
                        && x.OrderTime < end)
            .Join(_uow.Offices.Query(), o => o.OfficeId, of => of.Id, (o, of) => new
            {
                o.Id,
                o.OrderNumber,
                o.Status,
                o.OrderTime,
                Office = new { of.OfficeName, of.Address, of.Phone, of.ContactPerson }
            })
            .OrderBy(x => x.OrderTime)
            .ToListAsync(ct);

        return data.Cast<object>().ToList();
    }

    public async Task<object> GetDeliveredReportAsync(Guid deliveryUserId, DateOnly date, CancellationToken ct)
    {
        var deliveryBoy = await _uow.DeliveryBoys.Query().FirstOrDefaultAsync(x => x.DeliveryUserId == deliveryUserId, ct);
        if (deliveryBoy is null)
        {
            throw new AppException("Delivery profile not found.", 404);
        }

        var start = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(1);

        var orders = await _uow.Orders.Query()
            .Where(x => x.DeliveryBoyId == deliveryBoy.Id
                        && x.Status == OrderStatus.Delivered
                        && x.OrderTime >= start
                        && x.OrderTime < end)
            .Join(_uow.Offices.Query(), o => o.OfficeId, of => of.Id, (o, of) => new
            {
                OrderId = o.Id,
                o.OrderNumber,
                o.OrderTime,
                o.Status,
                o.StallId,
                o.OfficeId,
                o.DeliveryBoyId,
                o.PaymentReceived,
                PaymentMode = o.PaymentMode.ToString(),
                Office = new
                {
                    id = of.Id,
                    name = of.OfficeName,
                    address = of.Address,
                    phone = of.Phone,
                    contactPerson = of.ContactPerson
                }
            })
            .OrderByDescending(x => x.OrderTime)
            .ToListAsync(ct);

        var orderIds = orders.Select(x => x.OrderId).ToList();
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

        var ordersOut = orders.Select(o =>
        {
            var items = itemRows.Where(i => i.OrderId == o.OrderId).ToList();
            return new
            {
                id = o.OrderId,
                orderNumber = o.OrderNumber,
                status = o.Status.ToString(),
                orderTime = o.OrderTime,
                office = o.Office,
                items,
                amount = items.Sum(x => x.amount),
                paymentReceived = o.PaymentReceived,
                paymentMode = o.PaymentMode
            };
        }).ToList();

        var cashCollected = ordersOut.Where(x => x.paymentReceived && string.Equals(x.paymentMode, "Cash", StringComparison.OrdinalIgnoreCase)).Sum(x => x.amount);
        var creditAmount = ordersOut.Sum(x => x.amount) - cashCollected;

        var byItem = itemRows
            .GroupBy(x => x.menuItemId)
            .Select(g => new
            {
                menuItemId = g.Key,
                itemName = g.First().itemName,
                category = g.First().category,
                quantity = g.Sum(x => x.quantity),
                amount = g.Sum(x => x.amount)
            })
            .OrderByDescending(x => x.quantity)
            .ToList();

        var byOffice = ordersOut
            .GroupBy(x => x.office.id)
            .Select(g => new
            {
                officeId = g.Key,
                officeName = g.First().office.name,
                phone = g.First().office.phone,
                orders = g.Count(),
                amount = g.Sum(x => x.amount)
            })
            .OrderByDescending(x => x.orders)
            .ToList();

        return new
        {
            date = date.ToString("yyyy-MM-dd"),
            deliveryBoyId = deliveryBoy.Id,
            totalOrders = ordersOut.Count,
            totalAmount = ordersOut.Sum(x => x.amount),
            cashCollected,
            creditAmount,
            orders = ordersOut,
            summary = new
            {
                byItem,
                byOffice
            }
        };
    }

    public async Task<object> GetMonthlyReportAsync(Guid deliveryUserId, int year, int month, CancellationToken ct)
    {
        var deliveryBoy = await _uow.DeliveryBoys.Query().FirstOrDefaultAsync(x => x.DeliveryUserId == deliveryUserId, ct);
        if (deliveryBoy is null)
        {
            throw new AppException("Delivery profile not found.", 404);
        }

        var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddMonths(1);

        var orders = await _uow.Orders.Query()
            .Where(x => x.DeliveryBoyId == deliveryBoy.Id
                        && x.Status == OrderStatus.Delivered
                        && x.OrderTime >= start
                        && x.OrderTime < end)
            .Join(_uow.Offices.Query(), o => o.OfficeId, of => of.Id, (o, of) => new
            {
                OrderId = o.Id,
                o.OrderNumber,
                o.OrderTime,
                o.PaymentReceived,
                PaymentMode = o.PaymentMode.ToString(),
                Office = new
                {
                    id = of.Id,
                    name = of.OfficeName,
                    phone = of.Phone
                }
            })
            .OrderByDescending(x => x.OrderTime)
            .ToListAsync(ct);

        var orderIds = orders.Select(x => x.OrderId).ToList();
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
                    amount = oi.Price * oi.Quantity
                })
                .ToListAsync(ct);

        var amountByOrder = itemRows
            .GroupBy(x => x.OrderId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.amount));

        var ordersOut = orders.Select(o => new
        {
            id = o.OrderId,
            orderNumber = o.OrderNumber,
            orderTime = o.OrderTime,
            office = o.Office,
            paymentReceived = o.PaymentReceived,
            paymentMode = o.PaymentMode,
            amount = amountByOrder.TryGetValue(o.OrderId, out var a) ? a : 0m
        }).ToList();

        var byDay = ordersOut
            .GroupBy(x => DateOnly.FromDateTime(x.orderTime.UtcDateTime))
            .Select(g =>
            {
                var total = g.Sum(x => x.amount);
                var cash = g.Where(x => x.paymentReceived && string.Equals(x.paymentMode, "Cash", StringComparison.OrdinalIgnoreCase)).Sum(x => x.amount);
                return new
                {
                    date = g.Key.ToString("yyyy-MM-dd"),
                    orders = g.Count(),
                    amount = total,
                    cashCollected = cash,
                    creditAmount = total - cash
                };
            })
            .OrderBy(x => x.date)
            .ToList();

        var byOffice = ordersOut
            .GroupBy(x => x.office.id)
            .Select(g => new
            {
                officeId = g.Key,
                officeName = g.First().office.name,
                phone = g.First().office.phone,
                orders = g.Count(),
                amount = g.Sum(x => x.amount)
            })
            .OrderByDescending(x => x.orders)
            .ToList();

        var byItem = itemRows
            .GroupBy(x => x.menuItemId)
            .Select(g => new
            {
                menuItemId = g.Key,
                itemName = g.First().itemName,
                category = g.First().category,
                quantity = g.Sum(x => x.quantity),
                amount = g.Sum(x => x.amount)
            })
            .OrderByDescending(x => x.quantity)
            .ToList();

        var totalAmount = ordersOut.Sum(x => x.amount);
        var cashCollected = ordersOut.Where(x => x.paymentReceived && string.Equals(x.paymentMode, "Cash", StringComparison.OrdinalIgnoreCase)).Sum(x => x.amount);

        return new
        {
            month = $"{year:D4}-{month:D2}",
            deliveryBoyId = deliveryBoy.Id,
            totalOrders = ordersOut.Count,
            totalAmount,
            cashCollected,
            creditAmount = totalAmount - cashCollected,
            byDay,
            summary = new
            {
                byOffice,
                byItem
            }
        };
    }

    public async Task AcceptOrderAsync(Guid deliveryUserId, Guid orderId, CancellationToken ct)
    {
        var deliveryBoy = await _uow.DeliveryBoys.Query().FirstOrDefaultAsync(x => x.DeliveryUserId == deliveryUserId, ct);
        if (deliveryBoy is null)
        {
            throw new AppException("Delivery profile not found.", 404);
        }

        var order = await _uow.Orders.Query().FirstOrDefaultAsync(x => x.Id == orderId, ct);
        if (order is null || order.StallId != deliveryBoy.StallId)
        {
            throw new AppException("Order not found.", 404);
        }

        if (order.Status != OrderStatus.Ready)
        {
            throw new AppException("Order is not ready for delivery.", 400);
        }

        if (order.DeliveryBoyId is not null && order.DeliveryBoyId != deliveryBoy.Id)
        {
            throw new AppException("Order is already assigned.", 409);
        }

        if (order.DeliveryBoyId is null)
        {
            order.DeliveryBoyId = deliveryBoy.Id;
            _uow.Orders.Update(order);
            await _uow.SaveChangesAsync(ct);
        }

        var officeUserId = await _uow.Offices.Query()
            .Where(x => x.Id == order.OfficeId)
            .Select(x => x.OfficeUserId)
            .FirstOrDefaultAsync(ct);

        var stallOwnerId = await _uow.TeaStalls.Query()
            .Where(x => x.Id == order.StallId)
            .Select(x => x.OwnerId)
            .FirstOrDefaultAsync(ct);

        var deliveryUserIds = await _uow.DeliveryBoys.Query()
            .Where(x => x.StallId == order.StallId)
            .Select(x => x.DeliveryUserId)
            .ToListAsync(ct);

        await _realtime.SendOrderEventToUsersAsync(
            new OrderRealtimeEvent(
                Type: "assigned",
                OrderId: order.Id,
                Status: order.Status.ToString(),
                StallId: order.StallId,
                OfficeId: order.OfficeId,
                DeliveryBoyId: order.DeliveryBoyId
            ),
            deliveryUserIds.Concat(new[] { officeUserId, stallOwnerId, deliveryUserId }),
            ct
        );
    }

    public async Task MarkPickedUpAsync(Guid deliveryUserId, Guid orderId, CancellationToken ct)
    {
        var deliveryBoy = await _uow.DeliveryBoys.Query().FirstOrDefaultAsync(x => x.DeliveryUserId == deliveryUserId, ct);
        if (deliveryBoy is null)
        {
            throw new AppException("Delivery profile not found.", 404);
        }

        var order = await _uow.Orders.Query().FirstOrDefaultAsync(x => x.Id == orderId, ct);
        if (order is null || order.DeliveryBoyId != deliveryBoy.Id)
        {
            throw new AppException("Order not found.", 404);
        }

        if (order.Status != OrderStatus.Ready)
        {
            throw new AppException("Only ready orders can be marked pickup.", 400);
        }

        order.Status = OrderStatus.Pickup;
        _uow.Orders.Update(order);
        await _uow.SaveChangesAsync(ct);

        var officeUserId = await _uow.Offices.Query()
            .Where(x => x.Id == order.OfficeId)
            .Select(x => x.OfficeUserId)
            .FirstOrDefaultAsync(ct);

        if (officeUserId != Guid.Empty)
        {
            await _notifications.SendToUserAsync(officeUserId, "Order Status", "Your order is Pickup.", ct);
        }

        var stallOwnerId = await _uow.TeaStalls.Query()
            .Where(x => x.Id == order.StallId)
            .Select(x => x.OwnerId)
            .FirstOrDefaultAsync(ct);

        await _realtime.SendOrderEventToUsersAsync(
            new OrderRealtimeEvent(
                Type: "status_changed",
                OrderId: order.Id,
                Status: order.Status.ToString(),
                StallId: order.StallId,
                OfficeId: order.OfficeId,
                DeliveryBoyId: order.DeliveryBoyId
            ),
            new[] { officeUserId, stallOwnerId, deliveryUserId },
            ct
        );
    }

    public async Task MarkDeliveredAsync(Guid deliveryUserId, Guid orderId, bool paymentReceived, string paymentMode, CancellationToken ct)
    {
        var deliveryBoy = await _uow.DeliveryBoys.Query().FirstOrDefaultAsync(x => x.DeliveryUserId == deliveryUserId, ct);
        if (deliveryBoy is null)
        {
            throw new AppException("Delivery profile not found.", 404);
        }

        var order = await _uow.Orders.Query().FirstOrDefaultAsync(x => x.Id == orderId, ct);
        if (order is null || order.DeliveryBoyId != deliveryBoy.Id)
        {
            throw new AppException("Order not found.", 404);
        }

        if (order.Status == OrderStatus.Cancelled)
        {
            throw new AppException("Order is cancelled.", 400);
        }

        if (order.Status != OrderStatus.Pickup)
        {
            throw new AppException("Only pickup orders can be marked delivered.", 400);
        }

        order.Status = OrderStatus.Delivered;
        Enum.TryParse<PaymentMode>(paymentMode, true, out var parsedMode);
        order.PaymentMode = parsedMode;
        order.PaymentReceived = paymentReceived;
        if (paymentReceived)
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

        if (officeUserId != Guid.Empty)
        {
            await _notifications.SendToUserAsync(officeUserId, "Order Status", "Your order is Delivered.", ct);
        }

        var stallOwnerId = await _uow.TeaStalls.Query()
            .Where(x => x.Id == order.StallId)
            .Select(x => x.OwnerId)
            .FirstOrDefaultAsync(ct);

        await _realtime.SendOrderEventToUsersAsync(
            new OrderRealtimeEvent(
                Type: "status_changed",
                OrderId: order.Id,
                Status: order.Status.ToString(),
                StallId: order.StallId,
                OfficeId: order.OfficeId,
                DeliveryBoyId: order.DeliveryBoyId
            ),
            new[] { officeUserId, stallOwnerId, deliveryUserId },
            ct
        );
    }
}
