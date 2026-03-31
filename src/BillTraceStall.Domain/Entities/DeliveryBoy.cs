namespace BillTraceStall.Domain.Entities;

public sealed class DeliveryBoy : EntityBase
{
    public Guid StallId { get; set; }

    public Guid DeliveryUserId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public TeaStall TeaStall { get; set; } = null!;

    public User DeliveryUser { get; set; } = null!;
}
