using System.Security.Claims;
using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.Exceptions;
using BillTraceStall.Domain.Entities;
using BillTraceStall.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/office/scheduled")]
[ApiVersion("1.0")]
[Authorize(Policy = "Office")]
public sealed class OfficeScheduledDeliveriesController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly INotificationService _notifications;
    private readonly IRealtimeService _realtime;
    private readonly IOrderNumberGenerator _orderNumbers;

    public OfficeScheduledDeliveriesController(IUnitOfWork uow, INotificationService notifications, IRealtimeService realtime, IOrderNumberGenerator orderNumbers)
    {
        _uow = uow;
        _notifications = notifications;
        _realtime = realtime;
        _orderNumbers = orderNumbers;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> Pending([FromQuery] string? date, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var office = await _uow.Offices.Query().FirstOrDefaultAsync(x => x.OfficeUserId == userId, ct);
        if (office is null)
        {
            throw new AppException("Office profile not found. Join a stall first.", 404);
        }

        var day = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!string.IsNullOrWhiteSpace(date) && !DateOnly.TryParse(date, out day))
        {
            return BadRequest(new { error = "Invalid date. Use YYYY-MM-DD." });
        }

        var deliveries = await _uow.ScheduledDeliveries.Query()
            .Where(x => x.OfficeId == office.Id && x.DeliveryDate == day)
            .Join(_uow.DeliveryBoys.Query(), sd => sd.DeliveryBoyId, db => db.Id, (sd, db) => new
            {
                sd.Id,
                sd.DeliveryDate,
                sd.DeliveryTime,
                Status = sd.Status.ToString(),
                sd.CreatedOrderId,
                DeliveryBoy = new { id = db.Id, name = db.Name, phone = db.Phone }
            })
            .OrderBy(x => x.DeliveryTime)
            .ToListAsync(ct);

        var ids = deliveries.Select(x => x.Id).ToList();
        var items = ids.Count == 0
            ? []
            : await _uow.ScheduledDeliveryItems.Query()
                .Where(x => ids.Contains(x.ScheduledDeliveryId))
                .Join(_uow.MenuItems.Query(), sdi => sdi.MenuItemId, mi => mi.Id, (sdi, mi) => new
                {
                    sdi.ScheduledDeliveryId,
                    menuItemId = mi.Id,
                    itemName = mi.ItemName,
                    category = mi.Category,
                    quantity = sdi.Quantity,
                    price = sdi.Price,
                    amount = sdi.Quantity * sdi.Price
                })
                .ToListAsync(ct);

        var createdOrderIds = deliveries
            .Select(x => x.CreatedOrderId)
            .Where(x => x != null && x != Guid.Empty)
            .Select(x => x!.Value)
            .Distinct()
            .ToList();

        var createdOrders = createdOrderIds.Count == 0
            ? []
            : await _uow.Orders.Query()
                .Where(x => createdOrderIds.Contains(x.Id))
                .Select(x => new { x.Id, x.OrderNumber })
                .ToListAsync(ct);

        var orderNumberById = createdOrders.ToDictionary(x => x.Id, x => x.OrderNumber);

        var mapped = deliveries.Select(d => new
        {
            d.Id,
            date = d.DeliveryDate.ToString("yyyy-MM-dd"),
            time = d.DeliveryTime.ToString("HH:mm"),
            d.Status,
            d.CreatedOrderId,
            createdOrderNumber = d.CreatedOrderId is null ? null : (orderNumberById.TryGetValue(d.CreatedOrderId.Value, out var n) ? n : null),
            d.DeliveryBoy,
            amount = items.Where(i => i.ScheduledDeliveryId == d.Id).Sum(i => i.amount),
            items = items.Where(i => i.ScheduledDeliveryId == d.Id).ToList()
        });

        return Ok(new { date = day.ToString("yyyy-MM-dd"), items = mapped });
    }

    [HttpPost("deliveries/{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveScheduledDeliveryRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var office = await _uow.Offices.Query().FirstOrDefaultAsync(x => x.OfficeUserId == userId, ct);
        if (office is null)
        {
            throw new AppException("Office profile not found. Join a stall first.", 404);
        }

        var delivery = await _uow.ScheduledDeliveries.Query().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (delivery is null || delivery.OfficeId != office.Id)
        {
            throw new AppException("Delivery entry not found.", 404);
        }

        if (delivery.Status != ScheduledDeliveryStatus.PendingApproval)
        {
            throw new AppException("Already processed.", 409);
        }

        var currentItems = await _uow.ScheduledDeliveryItems.Query()
            .Where(x => x.ScheduledDeliveryId == delivery.Id)
            .ToListAsync(ct);

        var finalItemsIn = (request.Items is null || request.Items.Count == 0)
            ? currentItems.Select(x => new ApproveScheduledDeliveryItem(x.MenuItemId, x.Quantity)).ToList()
            : request.Items.Where(x => x.Quantity > 0).ToList();

        if (finalItemsIn.Count == 0)
        {
            return BadRequest(new { error = "No items." });
        }

        var menuItemIds = finalItemsIn.Select(x => x.MenuItemId).Distinct().ToList();
        var menuItems = await _uow.MenuItems.Query()
            .Where(x => x.StallId == delivery.StallId && x.IsActive && menuItemIds.Contains(x.Id))
            .ToListAsync(ct);
        if (menuItems.Count != menuItemIds.Count)
        {
            return BadRequest(new { error = "Invalid menu items." });
        }

        foreach (var it in currentItems)
        {
            _uow.ScheduledDeliveryItems.Remove(it);
        }

        await _uow.SaveChangesAsync(ct);

        foreach (var it in finalItemsIn)
        {
            var mi = menuItems.First(x => x.Id == it.MenuItemId);
            await _uow.ScheduledDeliveryItems.AddAsync(new ScheduledDeliveryItem
            {
                ScheduledDeliveryId = delivery.Id,
                MenuItemId = mi.Id,
                Quantity = it.Quantity,
                Price = mi.Price
            }, ct);
        }

        await _uow.SaveChangesAsync(ct);

        var orderTime = new DateTimeOffset(
            new DateTime(delivery.DeliveryDate.Year, delivery.DeliveryDate.Month, delivery.DeliveryDate.Day, delivery.DeliveryTime.Hour, delivery.DeliveryTime.Minute, 0, DateTimeKind.Utc)
        );
        var orderNumber = await _orderNumbers.GenerateAsync(delivery.StallId, orderTime, ct);

        var order = new Order
        {
            StallId = delivery.StallId,
            OfficeId = delivery.OfficeId,
            DeliveryBoyId = delivery.DeliveryBoyId,
            OrderNumber = orderNumber,
            OrderType = OrderType.Scheduled,
            OrderTime = orderTime,
            Status = OrderStatus.Delivered,
            PaymentReceived = false,
            PaymentMode = PaymentMode.Credit
        };

        await _uow.Orders.AddAsync(order, ct);
        await _uow.SaveChangesAsync(ct);

        foreach (var it in finalItemsIn)
        {
            var mi = menuItems.First(x => x.Id == it.MenuItemId);
            await _uow.OrderItems.AddAsync(new OrderItem
            {
                OrderId = order.Id,
                MenuItemId = mi.Id,
                Quantity = it.Quantity,
                Price = mi.Price
            }, ct);
        }

        await _uow.SaveChangesAsync(ct);

        delivery.Status = ScheduledDeliveryStatus.Approved;
        delivery.ApprovedByOfficeUserId = userId;
        delivery.ApprovedAt = DateTimeOffset.UtcNow;
        delivery.CreatedOrderId = order.Id;
        _uow.ScheduledDeliveries.Update(delivery);
        await _uow.SaveChangesAsync(ct);

        var deliveryUserId = await _uow.DeliveryBoys.Query()
            .Where(x => x.Id == delivery.DeliveryBoyId)
            .Select(x => x.DeliveryUserId)
            .FirstOrDefaultAsync(ct);

        if (deliveryUserId != Guid.Empty)
        {
            await _notifications.SendToUserAsync(deliveryUserId, "Delivery Approved", "Office approved the delivery.", ct);
        }

        await _realtime.SendOrderEventToUsersAsync(
            new OrderRealtimeEvent(
                Type: "scheduled_approved",
                OrderId: order.Id,
                Status: order.Status.ToString(),
                StallId: order.StallId,
                OfficeId: order.OfficeId,
                DeliveryBoyId: order.DeliveryBoyId
            ),
            new[] { office.OfficeUserId, deliveryUserId },
            ct
        );

        return Ok(new { orderId = order.Id, orderNumber = order.OrderNumber });
    }

    [HttpPost("deliveries/{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var office = await _uow.Offices.Query().FirstOrDefaultAsync(x => x.OfficeUserId == userId, ct);
        if (office is null)
        {
            throw new AppException("Office profile not found. Join a stall first.", 404);
        }

        var delivery = await _uow.ScheduledDeliveries.Query().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (delivery is null || delivery.OfficeId != office.Id)
        {
            throw new AppException("Delivery entry not found.", 404);
        }

        if (delivery.Status != ScheduledDeliveryStatus.PendingApproval)
        {
            throw new AppException("Already processed.", 409);
        }

        delivery.Status = ScheduledDeliveryStatus.Rejected;
        delivery.RejectedByOfficeUserId = userId;
        delivery.RejectedAt = DateTimeOffset.UtcNow;
        _uow.ScheduledDeliveries.Update(delivery);
        await _uow.SaveChangesAsync(ct);

        var deliveryUserId = await _uow.DeliveryBoys.Query()
            .Where(x => x.Id == delivery.DeliveryBoyId)
            .Select(x => x.DeliveryUserId)
            .FirstOrDefaultAsync(ct);

        if (deliveryUserId != Guid.Empty)
        {
            await _notifications.SendToUserAsync(deliveryUserId, "Delivery Rejected", "Office rejected the delivery entry.", ct);
        }

        return Ok();
    }

    public sealed record ApproveScheduledDeliveryRequest(List<ApproveScheduledDeliveryItem>? Items);

    public sealed record ApproveScheduledDeliveryItem(Guid MenuItemId, int Quantity);
}
