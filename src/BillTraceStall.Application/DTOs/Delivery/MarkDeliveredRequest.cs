namespace BillTraceStall.Application.DTOs.Delivery;

public sealed record MarkDeliveredRequest(Guid OrderId, bool PaymentReceived = true, string PaymentMode = "Cash");
