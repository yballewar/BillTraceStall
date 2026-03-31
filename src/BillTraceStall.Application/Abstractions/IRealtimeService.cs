using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace BillTraceStall.Application.Abstractions;

public sealed record OrderRealtimeEvent(
    string Type,
    Guid OrderId,
    string Status,
    Guid StallId,
    Guid OfficeId,
    Guid? DeliveryBoyId
);

public interface IRealtimeService
{
    Task SendOrderEventToUsersAsync(OrderRealtimeEvent evt, IEnumerable<Guid> userIds, CancellationToken ct);
}

