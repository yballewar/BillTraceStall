using System.Security.Claims;
using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/office")]
[ApiVersion("1.0")]
[Authorize(Policy = "Office")]
public sealed class OfficeStallsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public OfficeStallsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [HttpGet("stalls")]
    public async Task<IActionResult> MyStalls(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

        var data = await _uow.Offices.Query()
            .Where(x => x.OfficeUserId == userId)
            .Join(_uow.TeaStalls.Query(), o => o.StallId, s => s.Id, (o, s) => new { o, s })
            .Join(_uow.Users.Query(), x => x.s.OwnerId, u => u.Id, (x, u) => new
            {
                OfficeId = x.o.Id,
                x.o.OfficeName,
                x.o.ContactPerson,
                x.o.Phone,
                x.o.Address,
                x.o.UniqueCode,
                Stall = new
                {
                    StallId = x.s.Id,
                    x.s.StallName,
                    x.s.Address,
                    x.s.City,
                    x.s.State,
                    x.s.Pincode,
                    x.s.UniqueCode,
                    OwnerPhone = u.Phone
                },
                x.o.CreatedAt
            })
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        return Ok(new { items = data });
    }

    [HttpGet("stalls/search")]
    public async Task<IActionResult> Search([FromQuery] string query, CancellationToken ct)
    {
        query ??= string.Empty;
        var q = query.Trim();
        if (q.Length < 2)
        {
            return Ok(new { items = Array.Empty<object>() });
        }

        var data = await _uow.TeaStalls.Query()
            .Join(_uow.Users.Query(), s => s.OwnerId, u => u.Id, (s, u) => new { s, u })
            .Where(x => x.s.IsApproved
                        && x.s.IsActive
                        && (x.s.StallName.Contains(q)
                            || x.s.Address.Contains(q)
                            || x.u.Phone.Contains(q)
                            || x.s.UniqueCode.Contains(q)))
            .OrderBy(x => x.s.StallName)
            .Select(x => new
            {
                StallId = x.s.Id,
                x.s.StallName,
                x.s.Address,
                x.s.City,
                x.s.State,
                x.s.Pincode,
                x.s.UniqueCode,
                OwnerPhone = x.u.Phone
            })
            .Take(30)
            .ToListAsync(ct);

        return Ok(new { items = data });
    }

    [HttpGet("stalls/{officeId:guid}/menu")]
    public async Task<IActionResult> Menu(Guid officeId, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

        var office = await _uow.Offices.Query().FirstOrDefaultAsync(x => x.Id == officeId && x.OfficeUserId == userId, ct);
        if (office is null)
        {
            return NotFound(new { message = "Office not found." });
        }

        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == office.StallId, ct);
        if (stall is null || !stall.IsApproved || !stall.IsActive)
        {
            return NotFound(new { message = "Tea stall not found or not active." });
        }

        var items = await _uow.MenuItems.Query()
            .Where(x => x.StallId == stall.Id && x.IsActive)
            .OrderBy(x => x.Category)
            .ThenBy(x => x.ItemName)
            .Select(x => new { id = x.Id, itemName = x.ItemName, price = x.Price, category = x.Category })
            .ToListAsync(ct);

        return Ok(new
        {
            officeId = office.Id,
            stall = new { id = stall.Id, stallName = stall.StallName, uniqueCode = stall.UniqueCode },
            items
        });
    }
}
