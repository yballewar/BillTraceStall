namespace BillTraceStall.Application.DTOs.Offices;

public sealed record JoinStallRequest(
    string StallUniqueCode,
    string OfficeName,
    string ContactPerson,
    string Phone,
    string Address
);
