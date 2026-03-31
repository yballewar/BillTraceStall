using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/billing")]
[ApiVersion("1.0")]
public sealed class BillingController : ControllerBase
{
    private readonly IBillingService _billing;

    public BillingController(IBillingService billing)
    {
        _billing = billing;
    }

    [HttpPost("generate")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> Generate([FromQuery] int month, [FromQuery] int year, CancellationToken ct)
    {
        await _billing.GenerateMonthlyBillsAsync(month, year, ct);
        return Accepted();
    }
}
