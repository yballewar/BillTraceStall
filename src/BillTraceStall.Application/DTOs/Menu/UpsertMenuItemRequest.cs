namespace BillTraceStall.Application.DTOs.Menu;

public sealed record UpsertMenuItemRequest(
    Guid? Id,
    string ItemName,
    decimal Price,
    string Category,
    bool IsActive
);
