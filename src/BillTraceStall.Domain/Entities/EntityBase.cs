namespace BillTraceStall.Domain.Entities;

public abstract class EntityBase
{
    public Guid Id { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
