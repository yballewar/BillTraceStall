using BillTraceStall.Application.DTOs.Orders;

namespace BillTraceStall.Application.Abstractions;

public interface IOrderService
{
    Task<Guid> CreateOrderAsync(Guid requestingUserId, CreateOrderRequest request, CancellationToken ct);
}
