using BillTraceStall.Application.DTOs.Offices;

namespace BillTraceStall.Application.Abstractions;

public interface IOfficeService
{
    Task<Guid> JoinStallAsync(Guid officeUserId, JoinStallRequest request, CancellationToken ct);
}
