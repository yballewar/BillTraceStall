using System.Security.Claims;
using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/device")]
[ApiVersion("1.0")]
[Authorize]
public sealed class DeviceController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public DeviceController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [HttpPost("push-token")]
    public async Task<IActionResult> RegisterPushToken([FromBody] RegisterPushTokenRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        if (userId == Guid.Empty)
        {
            throw new AppException("Not authorized.", 401);
        }

        var token = (request.PushToken ?? string.Empty).Trim();
        if (token.Length > 512)
        {
            throw new AppException("Push token too long.", 400);
        }

        var user = await _uow.Users.Query().FirstOrDefaultAsync(x => x.Id == userId, ct);
        if (user is null)
        {
            throw new AppException("User not found.", 404);
        }

        user.FcmToken = string.IsNullOrWhiteSpace(token) ? null : token;
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync(ct);
        return Ok();
    }

    public sealed record RegisterPushTokenRequest(string PushToken);
}

