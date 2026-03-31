using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.DTOs.Orders;
using BillTraceStall.Application.Exceptions;
using BillTraceStall.Domain.Entities;
using BillTraceStall.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.Infrastructure.Services;

public sealed class OrderService : IOrderService
{
    private readonly IUnitOfWork _uow;
    private readonly INotificationService _notifications;
    private readonly IRealtimeService _realtime;
    private readonly IOrderNumberGenerator _orderNumbers;

    public OrderService(IUnitOfWork uow, INotificationService notifications, IRealtimeService realtime, IOrderNumberGenerator orderNumbers)
    {
        _uow = uow;
        _notifications = notifications;
        _realtime = realtime;
        _orderNumbers = orderNumbers;
    }

    public async Task<Guid> CreateOrderAsync(Guid requestingUserId, CreateOrderRequest request, CancellationToken ct)
    {
        var office = await _uow.Offices.Query().FirstOrDefaultAsync(x => x.Id == request.OfficeId, ct);
        if (office is null)
        {
            throw new AppException("Office not found.", 404);
        }

        if (office.OfficeUserId != requestingUserId)
        {
            throw new AppException("Not allowed.", 403);
        }

        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == office.StallId, ct);
        if (stall is null || !stall.IsApproved || !stall.IsActive)
        {
            throw new AppException("Tea stall not found or not approved.", 403);
        }

        var orderType = request.OrderType.Equals("manual", StringComparison.OrdinalIgnoreCase)
            ? OrderType.Manual
            : OrderType.Scheduled;

        var orderTime = request.OrderTime ?? DateTimeOffset.UtcNow;
        var orderNumber = await _orderNumbers.GenerateAsync(office.StallId, orderTime, ct);

        var order = new Order
        {
            StallId = office.StallId,
            OfficeId = office.Id,
            DeliveryBoyId = request.DeliveryBoyId,
            OrderNumber = orderNumber,
            OrderType = orderType,
            OrderTime = orderTime,
            Status = OrderStatus.Pending
        };

        await _uow.Orders.AddAsync(order, ct);
        await _uow.SaveChangesAsync(ct);

        var menuItemIds = request.Items.Select(x => x.MenuItemId).Distinct().ToList();
        var menuItems = await _uow.MenuItems.Query()
            .Where(x => x.StallId == office.StallId && menuItemIds.Contains(x.Id))
            .ToListAsync(ct);

        if (menuItems.Count != menuItemIds.Count)
        {
            throw new AppException("Invalid menu items.", 400);
        }

        foreach (var item in request.Items)
        {
            var menuItem = menuItems.First(x => x.Id == item.MenuItemId);
            await _uow.OrderItems.AddAsync(new OrderItem
            {
                OrderId = order.Id,
                MenuItemId = menuItem.Id,
                Quantity = item.Quantity,
                Price = menuItem.Price
            }, ct);
        }

        await _uow.SaveChangesAsync(ct);

        var stallOwnerId = await _uow.TeaStalls.Query()
            .Where(x => x.Id == office.StallId)
            .Select(x => x.OwnerId)
            .FirstOrDefaultAsync(ct);

        if (stallOwnerId != Guid.Empty)
        {
            await _notifications.SendToUserAsync(stallOwnerId, "New Order", "A new order has been placed.", ct);
        }

        await _realtime.SendOrderEventToUsersAsync(
            new OrderRealtimeEvent(
                Type: "created",
                OrderId: order.Id,
                Status: order.Status.ToString(),
                StallId: order.StallId,
                OfficeId: order.OfficeId,
                DeliveryBoyId: order.DeliveryBoyId
            ),
            new[] { stallOwnerId, office.OfficeUserId },
            ct
        );

        return order.Id;
    }
}
