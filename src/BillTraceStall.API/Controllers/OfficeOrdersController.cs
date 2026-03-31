using System.Security.Claims;
using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.Exceptions;
using BillTraceStall.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/office")]
[ApiVersion("1.0")]
[Authorize(Policy = "Office")]
public sealed class OfficeOrdersController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly INotificationService _notifications;
    private readonly IRealtimeService _realtime;

    public OfficeOrdersController(IUnitOfWork uow, INotificationService notifications, IRealtimeService realtime)
    {
        _uow = uow;
        _notifications = notifications;
        _realtime = realtime;
    }

    [HttpGet("orders")]
    public async Task<IActionResult> Orders([FromQuery] Guid? officeId, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

        var offices = _uow.Offices.Query().Where(x => x.OfficeUserId == userId);
        if (officeId is not null && officeId != Guid.Empty)
        {
            offices = offices.Where(x => x.Id == officeId);
        }

        var officeRows = await offices
            .Select(x => new { x.Id, x.OfficeName, x.Address, x.Phone, x.ContactPerson, x.StallId })
            .ToListAsync(ct);

        var officeIds = officeRows.Select(x => x.Id).ToList();
        if (officeIds.Count == 0)
        {
            return Ok(new { items = Array.Empty<object>() });
        }

        var orders = await _uow.Orders.Query()
            .Where(x => officeIds.Contains(x.OfficeId) && x.OrderType != BillTraceStall.Domain.Enums.OrderType.Scheduled)
            .OrderByDescending(x => x.OrderTime)
            .Take(100)
            .Select(x => new
            {
                id = x.Id,
                x.OfficeId,
                orderNumber = x.OrderNumber,
                status = x.Status.ToString(),
                orderTime = x.OrderTime,
                deliveryBoyId = x.DeliveryBoyId,
                x.PaymentReceived,
                paymentMode = x.PaymentMode.ToString()
            })
            .ToListAsync(ct);

        var orderIds = orders.Select(x => x.id).ToList();
        var amounts = orderIds.Count == 0
            ? []
            : await _uow.OrderItems.Query()
                .Where(x => orderIds.Contains(x.OrderId))
                .GroupBy(x => x.OrderId)
                .Select(g => new { orderId = g.Key, amount = g.Sum(x => x.Price * x.Quantity) })
                .ToListAsync(ct);

        var items = orders.Select(o =>
        {
            var of = officeRows.First(x => x.Id == o.OfficeId);
            var amount = amounts.FirstOrDefault(x => x.orderId == o.id)?.amount ?? 0m;
            return new
            {
                o.id,
                orderNumber = o.orderNumber,
                o.status,
                o.orderTime,
                amount,
                paymentReceived = o.PaymentReceived,
                paymentMode = o.paymentMode,
                office = new { id = of.Id, name = of.OfficeName, address = of.Address, phone = of.Phone, contactPerson = of.ContactPerson }
            };
        });

        return Ok(new { items });
    }

    [HttpGet("orders-by-date")]
    public async Task<IActionResult> OrdersByDate([FromQuery] Guid officeId, [FromQuery] string date, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

        if (!DateOnly.TryParse(date, out var day))
        {
            return BadRequest(new { error = "Invalid date. Use YYYY-MM-DD." });
        }

        var office = await _uow.Offices.Query()
            .Where(x => x.Id == officeId && x.OfficeUserId == userId)
            .Select(x => new { x.Id, x.OfficeName, x.Address, x.Phone, x.ContactPerson })
            .FirstOrDefaultAsync(ct);

        if (office is null)
        {
            return NotFound(new { error = "Office not found." });
        }

        var start = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(1);

        var orders = await _uow.Orders.Query()
            .Where(x => x.OfficeId == office.Id
                        && x.OrderTime >= start
                        && x.OrderTime < end
                        )
            .OrderByDescending(x => x.OrderTime)
            .Select(x => new
            {
                id = x.Id,
                orderNumber = x.OrderNumber,
                status = x.Status.ToString(),
                orderTime = x.OrderTime,
                deliveryBoyId = x.DeliveryBoyId,
                x.PaymentReceived,
                paymentMode = x.PaymentMode.ToString()
            })
            .ToListAsync(ct);

        var orderIds = orders.Select(x => x.id).ToList();
        var amounts = orderIds.Count == 0
            ? []
            : await _uow.OrderItems.Query()
                .Where(x => orderIds.Contains(x.OrderId))
                .GroupBy(x => x.OrderId)
                .Select(g => new { orderId = g.Key, amount = g.Sum(x => x.Price * x.Quantity) })
                .ToListAsync(ct);

        var itemRows = orderIds.Count == 0
            ? []
            : await _uow.OrderItems.Query()
                .Where(x => orderIds.Contains(x.OrderId))
                .Join(_uow.MenuItems.Query(), oi => oi.MenuItemId, mi => mi.Id, (oi, mi) => new
                {
                    oi.OrderId,
                    mi.Category,
                    mi.ItemName,
                    Qty = oi.Quantity,
                    Amount = oi.Quantity * oi.Price
                })
                .ToListAsync(ct);

        var teaQty = itemRows.Where(x => IsTea(x.Category, x.ItemName)).Sum(x => x.Qty);
        var coffeeQty = itemRows.Where(x => IsCoffee(x.Category, x.ItemName)).Sum(x => x.Qty);
        var totalQty = itemRows.Sum(x => x.Qty);
        var totalAmount = itemRows.Sum(x => x.Amount);

        var items = orders.Select(o => new
        {
            o.id,
            orderNumber = o.orderNumber,
            o.status,
            o.orderTime,
            amount = amounts.FirstOrDefault(x => x.orderId == o.id)?.amount ?? 0m,
            paymentReceived = o.PaymentReceived,
            paymentMode = o.paymentMode,
            office = new { id = office.Id, name = office.OfficeName, address = office.Address, phone = office.Phone, contactPerson = office.ContactPerson }
        });

        return Ok(new
        {
            date = day.ToString("yyyy-MM-dd"),
            office = new { id = office.Id, name = office.OfficeName, phone = office.Phone },
            totalOrders = orders.Count,
            teaQty,
            coffeeQty,
            totalQty,
            totalAmount,
            items
        });
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

    [HttpGet("orders/{orderId:guid}")]
    public async Task<IActionResult> Order(Guid orderId, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

        var order = await _uow.Orders.Query().FirstOrDefaultAsync(x => x.Id == orderId, ct);
        if (order is null)
        {
            return NotFound(new { message = "Order not found." });
        }

        var office = await _uow.Offices.Query().FirstOrDefaultAsync(x => x.Id == order.OfficeId && x.OfficeUserId == userId, ct);
        if (office is null)
        {
            return NotFound(new { message = "Order not found." });
        }

        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == order.StallId, ct);

        var items = await _uow.OrderItems.Query()
            .Where(x => x.OrderId == order.Id)
            .Join(_uow.MenuItems.Query(), oi => oi.MenuItemId, mi => mi.Id, (oi, mi) => new
            {
                id = mi.Id,
                itemName = mi.ItemName,
                category = mi.Category,
                quantity = oi.Quantity,
                price = oi.Price,
                amount = oi.Quantity * oi.Price
            })
            .ToListAsync(ct);

        return Ok(new
        {
            id = order.Id,
            orderNumber = order.OrderNumber,
            status = order.Status.ToString(),
            orderTime = order.OrderTime,
            paymentReceived = order.PaymentReceived,
            paymentMode = order.PaymentMode.ToString(),
            office = new { id = office.Id, name = office.OfficeName, address = office.Address, phone = office.Phone, contactPerson = office.ContactPerson },
            stall = stall is null ? null : new { id = stall.Id, stallName = stall.StallName, uniqueCode = stall.UniqueCode },
            items,
            amount = items.Sum(x => x.amount)
        });
    }

    [HttpPost("orders/{orderId:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid orderId, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

        var order = await _uow.Orders.Query().FirstOrDefaultAsync(x => x.Id == orderId, ct);
        if (order is null)
        {
            throw new AppException("Order not found.", 404);
        }

        var office = await _uow.Offices.Query().FirstOrDefaultAsync(x => x.Id == order.OfficeId && x.OfficeUserId == userId, ct);
        if (office is null)
        {
            throw new AppException("Order not found.", 404);
        }

        if (order.Status == OrderStatus.Cancelled)
        {
            return Ok();
        }

        if (order.Status is not (OrderStatus.Pending or OrderStatus.Preparing))
        {
            throw new AppException("Only pending/preparing orders can be cancelled.", 400);
        }

        if (order.DeliveryBoyId is not null)
        {
            throw new AppException("Order already assigned.", 400);
        }

        var now = DateTimeOffset.UtcNow;
        var createdAt = order.CreatedAt == default ? order.OrderTime : order.CreatedAt;
        if (now - createdAt > TimeSpan.FromMinutes(2))
        {
            throw new AppException("Cancel allowed only within 2 minutes.", 400);
        }

        order.Status = OrderStatus.Cancelled;
        _uow.Orders.Update(order);
        await _uow.SaveChangesAsync(ct);

        var stallOwnerId = await _uow.TeaStalls.Query()
            .Where(x => x.Id == order.StallId)
            .Select(x => x.OwnerId)
            .FirstOrDefaultAsync(ct);

        if (stallOwnerId != Guid.Empty)
        {
            await _notifications.SendToUserAsync(stallOwnerId, "Order Cancelled", "An order was cancelled by office.", ct);
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
            new[] { stallOwnerId, office.OfficeUserId },
            ct
        );

        return Ok();
    }
}
