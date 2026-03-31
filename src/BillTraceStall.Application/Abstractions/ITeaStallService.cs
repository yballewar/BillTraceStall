using BillTraceStall.Application.DTOs.Delivery;
using BillTraceStall.Application.DTOs.Menu;
using BillTraceStall.Application.DTOs.TeaStalls;

namespace BillTraceStall.Application.Abstractions;

public interface ITeaStallService
{
    Task<Guid> CreateTeaStallAsync(Guid ownerUserId, CreateTeaStallRequest request, CancellationToken ct);
    Task UpsertMenuItemsAsync(Guid ownerUserId, List<UpsertMenuItemRequest> items, CancellationToken ct);
    Task<Guid> AddDeliveryBoyAsync(Guid ownerUserId, CreateDeliveryBoyRequest request, CancellationToken ct);
    Task UpdateDeliveryBoyAsync(Guid ownerUserId, Guid deliveryBoyId, UpdateDeliveryBoyRequest request, CancellationToken ct);
    Task AssignDeliveryBoyToOfficeAsync(Guid ownerUserId, Guid officeId, Guid deliveryBoyId, CancellationToken ct);
}
