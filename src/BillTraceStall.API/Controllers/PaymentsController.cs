using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.DTOs.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Security.Claims;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/payment")]
[ApiVersion("1.0")]
public sealed class PaymentsController : ControllerBase
{
    private readonly IPaymentService _payments;

    public PaymentsController(IPaymentService payments)
    {
        _payments = payments;
    }

    [HttpPost("create")]
    [Authorize(Policy = "Office")]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var result = await _payments.CreateRazorpayOrderAsync(userId, request, ct);
        return Ok(result);
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook(CancellationToken ct)
    {
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var raw = await reader.ReadToEndAsync();
        var headers = Request.Headers.ToDictionary(k => k.Key, v => v.Value.ToString());
        await _payments.HandleRazorpayWebhookAsync(raw, headers, ct);
        return Ok();
    }
}
