namespace BillTraceStall.Domain.Entities;

public sealed class OrderDailyCounter
{
    public Guid StallId { get; set; }

    public DateOnly OrderDate { get; set; }

    public long LastNumber { get; set; }
}
