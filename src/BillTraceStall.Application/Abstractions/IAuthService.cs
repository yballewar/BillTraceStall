using BillTraceStall.Application.DTOs.Auth;

namespace BillTraceStall.Application.Abstractions;

public interface IAuthService
{
    Task RequestOtpForRegistrationAsync(RegisterRequest request, CancellationToken ct);
    Task<(bool Sent, int StatusCode, string? Error)> RequestOtpForLoginAsync(LoginRequest request, CancellationToken ct);
    Task<AuthResult> VerifyOtpAsync(VerifyOtpRequest request, CancellationToken ct);
    Task<AuthResult> LoginWithPasswordAsync(PasswordLoginRequest request, CancellationToken ct);
    Task SetPasswordAsync(Guid userId, SetPasswordRequest request, CancellationToken ct);
    Task<AuthResult> VerifyRegistrationAsync(VerifyRegistrationRequest request, CancellationToken ct);
}
