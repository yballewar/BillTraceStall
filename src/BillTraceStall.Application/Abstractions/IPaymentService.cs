using BillTraceStall.Application.DTOs.Payments;

namespace BillTraceStall.Application.Abstractions;

public interface IPaymentService
{
    Task<object> CreateRazorpayOrderAsync(Guid requestingUserId, CreatePaymentRequest request, CancellationToken ct);
    Task HandleRazorpayWebhookAsync(string rawBody, IDictionary<string, string> headers, CancellationToken ct);
}
