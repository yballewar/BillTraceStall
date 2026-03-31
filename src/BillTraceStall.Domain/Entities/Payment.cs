using BillTraceStall.Domain.Enums;

namespace BillTraceStall.Domain.Entities;

public sealed class Payment : EntityBase
{
    public Guid BillId { get; set; }

    public string PaymentGateway { get; set; } = "Razorpay";

    public string? TransactionId { get; set; }

    public string? RazorpayOrderId { get; set; }

    public string? RazorpayPaymentId { get; set; }

    public decimal Amount { get; set; }

    public PaymentStatus PaymentStatus { get; set; }

    public DateTimeOffset? PaidAt { get; set; }

    public Bill Bill { get; set; } = null!;
}
