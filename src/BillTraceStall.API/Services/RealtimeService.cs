using BillTraceStall.API.Hubs;
using BillTraceStall.Application.Abstractions;
using Microsoft.AspNetCore.SignalR;

namespace BillTraceStall.API.Services;

public sealed class RealtimeService : IRealtimeService
{
    private readonly IHubContext<OrdersHub> _hub;

    public RealtimeService(IHubContext<OrdersHub> hub)
    {
        _hub = hub;
    }

    public async Task SendOrderEventToUsersAsync(OrderRealtimeEvent evt, IEnumerable<Guid> userIds, CancellationToken ct)
    {
        var targets = userIds
            .Where(x => x != Guid.Empty)
            .Distinct()
            .Select(OrdersHub.UserGroup)
            .ToList();

        if (targets.Count == 0)
        {
            return;
        }

        await _hub.Clients.Groups(targets).SendAsync("orderEvent", evt, ct);
    }
}

