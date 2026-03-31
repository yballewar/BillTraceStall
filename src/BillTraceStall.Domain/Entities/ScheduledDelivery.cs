using BillTraceStall.Domain.Enums;

namespace BillTraceStall.Domain.Entities;

public sealed class ScheduledDelivery : EntityBase
{
    public Guid StallId { get; set; }

    public Guid OfficeId { get; set; }

    public Guid DeliveryBoyId { get; set; }

    public Guid? ScheduleId { get; set; }

    public DateOnly DeliveryDate { get; set; }

    public TimeOnly DeliveryTime { get; set; }

    public ScheduledDeliveryStatus Status { get; set; } = ScheduledDeliveryStatus.PendingApproval;

    public Guid? ApprovedByOfficeUserId { get; set; }

    public DateTimeOffset? ApprovedAt { get; set; }

    public Guid? RejectedByOfficeUserId { get; set; }

    public DateTimeOffset? RejectedAt { get; set; }

    public Guid? CreatedOrderId { get; set; }

    public TeaStall TeaStall { get; set; } = null!;

    public Office Office { get; set; } = null!;

    public DeliveryBoy DeliveryBoy { get; set; } = null!;

    public Schedule? Schedule { get; set; }

    public List<ScheduledDeliveryItem> Items { get; set; } = new();
}

