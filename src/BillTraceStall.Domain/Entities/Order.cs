using BillTraceStall.Domain.Enums;

namespace BillTraceStall.Domain.Entities;

public sealed class Order : EntityBase
{
    public Guid StallId { get; set; }

    public Guid OfficeId { get; set; }

    public Guid? DeliveryBoyId { get; set; }

    public string OrderNumber { get; set; } = null!;

    public OrderType OrderType { get; set; }

    public DateTimeOffset OrderTime { get; set; }

    public OrderStatus Status { get; set; }

    public bool PaymentReceived { get; set; }

    public PaymentMode PaymentMode { get; set; }

    public DateTimeOffset? PaymentReceivedAt { get; set; }

    public TeaStall TeaStall { get; set; } = null!;

    public Office Office { get; set; } = null!;

    public DeliveryBoy? DeliveryBoy { get; set; }

    public List<OrderItem> Items { get; set; } = new();
}
