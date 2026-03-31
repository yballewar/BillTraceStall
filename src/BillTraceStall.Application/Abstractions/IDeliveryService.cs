namespace BillTraceStall.Application.Abstractions;

public interface IDeliveryService
{
    Task<List<object>> GetTodayDeliveriesAsync(Guid deliveryUserId, DateOnly today, CancellationToken ct);
    Task<List<object>> GetAvailableReadyOrdersAsync(Guid deliveryUserId, DateOnly today, CancellationToken ct);
    Task<object> GetDeliveredReportAsync(Guid deliveryUserId, DateOnly date, CancellationToken ct);
    Task<object> GetMonthlyReportAsync(Guid deliveryUserId, int year, int month, CancellationToken ct);
    Task AcceptOrderAsync(Guid deliveryUserId, Guid orderId, CancellationToken ct);
    Task MarkPickedUpAsync(Guid deliveryUserId, Guid orderId, CancellationToken ct);
    Task MarkDeliveredAsync(Guid deliveryUserId, Guid orderId, bool paymentReceived, string paymentMode, CancellationToken ct);
}
