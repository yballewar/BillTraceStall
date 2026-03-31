namespace BillTraceStall.Application.DTOs.Auth;

public sealed record AuthResult(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    string Role
);
