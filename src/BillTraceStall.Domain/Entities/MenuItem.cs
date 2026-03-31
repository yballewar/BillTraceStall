namespace BillTraceStall.Domain.Entities;

public sealed class MenuItem : EntityBase
{
    public Guid StallId { get; set; }

    public string ItemName { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public string Category { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public TeaStall TeaStall { get; set; } = null!;
}
