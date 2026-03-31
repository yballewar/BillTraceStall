


using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace BillTraceStall.API.Hubs;

[Authorize]
public sealed class OrdersHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var raw = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(raw, out var userId) && userId != Guid.Empty)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));
        }

        await base.OnConnectedAsync();
    }

    public static string UserGroup(Guid userId) => $"user:{userId:D}";
}

