namespace BillTraceStall.Application.DTOs.Auth;

public sealed record VerifyRegistrationRequest(string Phone, string Otp, string? Password);

