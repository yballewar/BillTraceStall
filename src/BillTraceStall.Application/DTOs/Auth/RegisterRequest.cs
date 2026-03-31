namespace BillTraceStall.Application.DTOs.Auth;

public sealed record RegisterRequest(
    string Name,
    string Phone,
    string Role,
    string? Address,
    string? DesignationName,
    string? StallName,
    string? StallAddress,
    string? City,
    string? State,
    string? Pincode
);
