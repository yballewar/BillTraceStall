using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.DTOs.Delivery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/delivery")]
[ApiVersion("1.0")]
[Authorize(Policy = "DeliveryBoy")]
public sealed class DeliveryController : ControllerBase
{
    private readonly IDeliveryService _delivery;

    public DeliveryController(IDeliveryService delivery)
    {
        _delivery = delivery;
    }

    [HttpGet("today")]
    public async Task<IActionResult> Today(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var data = await _delivery.GetTodayDeliveriesAsync(userId, DateOnly.FromDateTime(DateTime.UtcNow), ct);
        return Ok(data);
    }

    [HttpGet("available")]
    public async Task<IActionResult> Available(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var data = await _delivery.GetAvailableReadyOrdersAsync(userId, DateOnly.FromDateTime(DateTime.UtcNow), ct);
        return Ok(data);
    }

    [HttpGet("delivered-report")]
    public async Task<IActionResult> DeliveredReport([FromQuery] string? date, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var parsed = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!string.IsNullOrWhiteSpace(date))
        {
            if (!DateOnly.TryParse(date, out parsed))
            {
                return BadRequest(new { error = "Invalid date. Use YYYY-MM-DD." });
            }
        }

        var data = await _delivery.GetDeliveredReportAsync(userId, parsed, ct);
        return Ok(data);
    }

    [HttpGet("monthly-report")]
    public async Task<IActionResult> MonthlyReport([FromQuery] int year, [FromQuery] int month, CancellationToken ct)
    {
        if (year < 2000 || year > 2100 || month < 1 || month > 12)
        {
            return BadRequest(new { error = "Invalid year/month." });
        }

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var data = await _delivery.GetMonthlyReportAsync(userId, year, month, ct);
        return Ok(data);
    }

    [HttpPost("accept")]
    public async Task<IActionResult> Accept([FromBody] AcceptDeliveryRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        await _delivery.AcceptOrderAsync(userId, request.OrderId, ct);
        return Ok();
    }

    [HttpPost("mark-pickup")]
    public async Task<IActionResult> MarkPickup([FromBody] MarkPickupRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        await _delivery.MarkPickedUpAsync(userId, request.OrderId, ct);
        return Ok();
    }

    [HttpPost("mark-delivered")]
    public async Task<IActionResult> MarkDelivered([FromBody] MarkDeliveredRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        await _delivery.MarkDeliveredAsync(userId, request.OrderId, request.PaymentReceived, request.PaymentMode, ct);
        return Ok();
    }

    public sealed record AcceptDeliveryRequest(Guid OrderId);
    public sealed record MarkPickupRequest(Guid OrderId);
}
