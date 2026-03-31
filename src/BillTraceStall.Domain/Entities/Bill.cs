using BillTraceStall.Domain.Enums;

namespace BillTraceStall.Domain.Entities;

public sealed class Bill : EntityBase
{
    public Guid StallId { get; set; }

    public Guid OfficeId { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }

    public decimal TotalAmount { get; set; }

    public BillStatus Status { get; set; }

    public DateTimeOffset GeneratedAt { get; set; }

    public TeaStall TeaStall { get; set; } = null!;

    public Office Office { get; set; } = null!;

    public List<Payment> Payments { get; set; } = new();
}
