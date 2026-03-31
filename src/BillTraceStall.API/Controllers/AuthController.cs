using System.Security.Claims;
using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.DTOs.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/auth")]
[ApiVersion("1.0")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth)
    {
        _auth = auth;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        await _auth.RequestOtpForRegistrationAsync(request, ct);
        return Accepted();
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var (sent, statusCode, error) = await _auth.RequestOtpForLoginAsync(request, ct);
        if (sent)
        {
            return Accepted();
        }
        return StatusCode(statusCode, new { error = error ?? "Login failed." });
    }

    [HttpPost("verify-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request, CancellationToken ct)
    {
        var result = await _auth.VerifyOtpAsync(request, ct);
        return Ok(result);
    }

    [HttpPost("verify-registration")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyRegistration([FromBody] VerifyRegistrationRequest request, CancellationToken ct)
    {
        var result = await _auth.VerifyRegistrationAsync(request, ct);
        return Ok(result);
    }

    [HttpPost("login-password")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginPassword([FromBody] PasswordLoginRequest request, CancellationToken ct)
    {
        var result = await _auth.LoginWithPasswordAsync(request, ct);
        return Ok(result);
    }

    [HttpPost("set-password")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> SetPassword([FromBody] SetPasswordRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        await _auth.SetPasswordAsync(userId, request, ct);
        return Ok();
    }
}
