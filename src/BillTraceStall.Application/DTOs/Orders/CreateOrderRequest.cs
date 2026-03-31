namespace BillTraceStall.Application.DTOs.Orders;

public sealed record CreateOrderRequest(
    Guid OfficeId,
    Guid? DeliveryBoyId,
    string OrderType,
    DateTimeOffset? OrderTime,
    List<CreateOrderItemRequest> Items
);

public sealed record CreateOrderItemRequest(
    Guid MenuItemId,
    int Quantity
);
