using System.Security.Claims;
using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.DTOs.Menu;
using BillTraceStall.Application.DTOs.TeaStalls;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/stall")]
[ApiVersion("1.0")]
[Authorize(Policy = "TeaStallOwner")]
public sealed class TeaStallController : ControllerBase
{
    private readonly ITeaStallService _stallService;

    public TeaStallController(ITeaStallService stallService)
    {
        _stallService = stallService;
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CreateTeaStallRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var id = await _stallService.CreateTeaStallAsync(userId, request, ct);
        return Ok(new { id });
    }

    [HttpPost("menu")]
    public async Task<IActionResult> UpsertMenu([FromBody] List<UpsertMenuItemRequest> items, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        await _stallService.UpsertMenuItemsAsync(userId, items, ct);
        return Ok();
    }
}
