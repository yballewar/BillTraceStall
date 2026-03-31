using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.DTOs.Offices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/office")]
[ApiVersion("1.0")]
[Authorize(Policy = "Office")]
public sealed class OfficeController : ControllerBase
{
    private readonly IOfficeService _officeService;

    public OfficeController(IOfficeService officeService)
    {
        _officeService = officeService;
    }

    [HttpPost("join-stall")]
    public async Task<IActionResult> JoinStall([FromBody] JoinStallRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var id = await _officeService.JoinStallAsync(userId, request, ct);
        return Ok(new { id });
    }
}
