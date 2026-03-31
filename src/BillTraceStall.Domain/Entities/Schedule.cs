namespace BillTraceStall.Domain.Entities;

public sealed class Schedule : EntityBase
{
    public Guid OfficeId { get; set; }

    public Guid StallId { get; set; }

    public TimeOnly DeliveryTime { get; set; }

    public int DaysOfWeekMask { get; set; } = 127;

    public bool IsActive { get; set; } = true;

    public Office Office { get; set; } = null!;

    public TeaStall TeaStall { get; set; } = null!;
}
