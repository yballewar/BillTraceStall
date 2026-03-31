using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/public")]
[ApiVersion("1.0")]
[AllowAnonymous]
public sealed class PublicController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public PublicController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [HttpGet("designations")]
    public async Task<IActionResult> Designations(CancellationToken ct)
    {
        var data = await _uow.Designations.Query()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new { x.Id, x.Name })
            .ToListAsync(ct);

        return Ok(data);
    }
}

