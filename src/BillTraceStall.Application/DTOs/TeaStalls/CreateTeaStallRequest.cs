namespace BillTraceStall.Application.DTOs.TeaStalls;

public sealed record CreateTeaStallRequest(
    string StallName,
    string Address,
    string City,
    string State,
    string Pincode
);
