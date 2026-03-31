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
[Route("api/v{version:apiVersion}/delivery/scheduled")]
[ApiVersion("1.0")]
[Authorize(Policy = "DeliveryBoy")]
public sealed class DeliveryScheduledController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly INotificationService _notifications;

    public DeliveryScheduledController(IUnitOfWork uow, INotificationService notifications)
    {
        _uow = uow;
        _notifications = notifications;
    }

    [HttpGet("meta")]
    public async Task<IActionResult> Meta([FromQuery] string? date, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var deliveryBoy = await _uow.DeliveryBoys.Query().FirstOrDefaultAsync(x => x.DeliveryUserId == userId, ct);
        if (deliveryBoy is null)
        {
            throw new AppException("Delivery profile not found.", 404);
        }

        var day = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!string.IsNullOrWhiteSpace(date) && !DateOnly.TryParse(date, out day))
        {
            return BadRequest(new { error = "Invalid date. Use YYYY-MM-DD." });
        }

        var offices = await _uow.Offices.Query()
            .Where(x => x.StallId == deliveryBoy.StallId)
            .OrderBy(x => x.OfficeName)
            .Select(x => new { id = x.Id, name = x.OfficeName, x.Phone, x.Address })
            .ToListAsync(ct);

        var schedules = await _uow.Schedules.Query()
            .Where(x => x.StallId == deliveryBoy.StallId && x.IsActive)
            .Select(x => new { x.Id, x.OfficeId, deliveryTime = x.DeliveryTime.ToString("HH:mm") })
            .ToListAsync(ct);

        var menuItems = await _uow.MenuItems.Query()
            .Where(x => x.StallId == deliveryBoy.StallId && x.IsActive)
            .OrderBy(x => x.Category)
            .ThenBy(x => x.ItemName)
            .Select(x => new { id = x.Id, x.ItemName, x.Category, x.Price })
            .ToListAsync(ct);

        return Ok(new
        {
            date = day.ToString("yyyy-MM-dd"),
            offices = offices.Select(o => new
            {
                o.id,
                o.name,
                o.Phone,
                o.Address,
                schedules = schedules.Where(s => s.OfficeId == o.id).ToList()
            }),
            menuItems
        });
    }

    [HttpPost("deliveries")]
    public async Task<IActionResult> Create([FromBody] CreateScheduledDeliveryRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var deliveryBoy = await _uow.DeliveryBoys.Query().FirstOrDefaultAsync(x => x.DeliveryUserId == userId, ct);
        if (deliveryBoy is null)
        {
            throw new AppException("Delivery profile not found.", 404);
        }

        if (!DateOnly.TryParse(request.Date, out var day))
        {
            return BadRequest(new { error = "Invalid date. Use YYYY-MM-DD." });
        }

        var office = await _uow.Offices.Query()
            .FirstOrDefaultAsync(x => x.Id == request.OfficeId && x.StallId == deliveryBoy.StallId, ct);
        if (office is null)
        {
            throw new AppException("Office not found.", 404);
        }

        TimeOnly time;
        Guid? scheduleId = null;
        if (request.ScheduleId is not null && request.ScheduleId != Guid.Empty)
        {
            var schedule = await _uow.Schedules.Query()
                .FirstOrDefaultAsync(x => x.Id == request.ScheduleId && x.OfficeId == office.Id && x.StallId == deliveryBoy.StallId && x.IsActive, ct);
            if (schedule is null)
            {
                throw new AppException("Schedule not found.", 404);
            }

            scheduleId = schedule.Id;
            time = schedule.DeliveryTime;
        }
        else if (!string.IsNullOrWhiteSpace(request.DeliveryTime) && TimeOnly.TryParse(request.DeliveryTime, out var parsed))
        {
            time = parsed;
        }
        else
        {
            time = TimeOnly.FromDateTime(DateTime.UtcNow);
        }

        var itemsIn = request.Items.Where(x => x.Quantity > 0).ToList();
        if (itemsIn.Count == 0)
        {
            return BadRequest(new { error = "No items." });
        }

        var menuItemIds = itemsIn.Select(x => x.MenuItemId).Distinct().ToList();
        var menuItems = await _uow.MenuItems.Query()
            .Where(x => x.StallId == deliveryBoy.StallId && x.IsActive && menuItemIds.Contains(x.Id))
            .ToListAsync(ct);

        if (menuItems.Count != menuItemIds.Count)
        {
            return BadRequest(new { error = "Invalid menu items." });
        }

        var sd = new ScheduledDelivery
        {
            StallId = deliveryBoy.StallId,
            OfficeId = office.Id,
            DeliveryBoyId = deliveryBoy.Id,
            ScheduleId = scheduleId,
            DeliveryDate = day,
            DeliveryTime = time,
            Status = ScheduledDeliveryStatus.PendingApproval
        };

        await _uow.ScheduledDeliveries.AddAsync(sd, ct);
        await _uow.SaveChangesAsync(ct);

        foreach (var it in itemsIn)
        {
            var mi = menuItems.First(x => x.Id == it.MenuItemId);
            await _uow.ScheduledDeliveryItems.AddAsync(new ScheduledDeliveryItem
            {
                ScheduledDeliveryId = sd.Id,
                MenuItemId = mi.Id,
                Quantity = it.Quantity,
                Price = mi.Price
            }, ct);
        }

        await _uow.SaveChangesAsync(ct);

        if (office.OfficeUserId != Guid.Empty)
        {
            await _notifications.SendToUserAsync(office.OfficeUserId, "Delivery", "Delivery entry submitted for approval.", ct);
        }

        return Ok(new { id = sd.Id });
    }

    [HttpGet("deliveries")]
    public async Task<IActionResult> MyDeliveries([FromQuery] string? date, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var deliveryBoy = await _uow.DeliveryBoys.Query().FirstOrDefaultAsync(x => x.DeliveryUserId == userId, ct);
        if (deliveryBoy is null)
        {
            throw new AppException("Delivery profile not found.", 404);
        }

        var day = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!string.IsNullOrWhiteSpace(date) && !DateOnly.TryParse(date, out day))
        {
            return BadRequest(new { error = "Invalid date. Use YYYY-MM-DD." });
        }

        var deliveries = await _uow.ScheduledDeliveries.Query()
            .Where(x => x.DeliveryBoyId == deliveryBoy.Id && x.DeliveryDate == day)
            .Join(_uow.Offices.Query(), sd => sd.OfficeId, of => of.Id, (sd, of) => new
            {
                sd.Id,
                sd.DeliveryDate,
                sd.DeliveryTime,
                Status = sd.Status.ToString(),
                sd.ApprovedAt,
                sd.RejectedAt,
                sd.CreatedOrderId,
                Office = new { id = of.Id, name = of.OfficeName, phone = of.Phone }
            })
            .OrderBy(x => x.DeliveryTime)
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

        var ids = deliveries.Select(x => x.Id).ToList();
        var items = ids.Count == 0
            ? []
            : await _uow.ScheduledDeliveryItems.Query()
                .Where(x => ids.Contains(x.ScheduledDeliveryId))
                .Join(_uow.MenuItems.Query(), sdi => sdi.MenuItemId, mi => mi.Id, (sdi, mi) => new
                {
                    sdi.ScheduledDeliveryId,
                    mi.ItemName,
                    mi.Category,
                    sdi.Quantity,
                    sdi.Price,
                    Amount = sdi.Quantity * sdi.Price
                })
                .ToListAsync(ct);

        var mapped = deliveries.Select(d => new
        {
            d.Id,
            date = d.DeliveryDate.ToString("yyyy-MM-dd"),
            time = d.DeliveryTime.ToString("HH:mm"),
            d.Status,
            d.ApprovedAt,
            d.RejectedAt,
            d.CreatedOrderId,
            createdOrderNumber = d.CreatedOrderId is null ? null : (orderNumberById.TryGetValue(d.CreatedOrderId.Value, out var n) ? n : null),
            d.Office,
            amount = items.Where(i => i.ScheduledDeliveryId == d.Id).Sum(i => i.Amount),
            items = items.Where(i => i.ScheduledDeliveryId == d.Id).Select(i => new { i.ItemName, i.Category, i.Quantity, i.Price, i.Amount }).ToList()
        });

        return Ok(new { date = day.ToString("yyyy-MM-dd"), items = mapped });
    }

    public sealed record CreateScheduledDeliveryRequest(
        Guid OfficeId,
        string Date,
        Guid? ScheduleId,
        string? DeliveryTime,
        List<CreateScheduledDeliveryItem> Items
    );

    public sealed record CreateScheduledDeliveryItem(Guid MenuItemId, int Quantity);
}
