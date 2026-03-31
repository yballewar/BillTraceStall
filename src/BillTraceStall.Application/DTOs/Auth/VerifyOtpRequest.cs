namespace BillTraceStall.Application.DTOs.Auth;

public sealed record VerifyOtpRequest(string Phone, string Otp);
