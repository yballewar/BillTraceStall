namespace BillTraceStall.Domain.Entities;

public sealed class ScheduledDeliveryItem : EntityBase
{
    public Guid ScheduledDeliveryId { get; set; }

    public Guid MenuItemId { get; set; }

    public int Quantity { get; set; }

    public decimal Price { get; set; }

    public ScheduledDelivery ScheduledDelivery { get; set; } = null!;

    public MenuItem MenuItem { get; set; } = null!;
}

