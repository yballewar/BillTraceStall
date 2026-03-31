namespace BillTraceStall.Domain.Entities;

public sealed class OrderItem : EntityBase
{
    public Guid OrderId { get; set; }

    public Guid MenuItemId { get; set; }

    public int Quantity { get; set; }

    public decimal Price { get; set; }

    public Order Order { get; set; } = null!;

    public MenuItem MenuItem { get; set; } = null!;
}
