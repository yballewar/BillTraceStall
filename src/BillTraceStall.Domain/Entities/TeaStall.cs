namespace BillTraceStall.Domain.Entities;

public sealed class TeaStall : EntityBase
{
    public Guid OwnerId { get; set; }

    public string StallName { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string State { get; set; } = string.Empty;

    public string Pincode { get; set; } = string.Empty;

    public string UniqueCode { get; set; } = string.Empty;

    public bool IsApproved { get; set; }

    public bool IsActive { get; set; } = true;

    public User Owner { get; set; } = null!;

    public List<Office> Offices { get; set; } = new();

    public List<DeliveryBoy> DeliveryBoys { get; set; } = new();

    public List<MenuItem> MenuItems { get; set; } = new();
}
