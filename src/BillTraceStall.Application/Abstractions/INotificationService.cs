namespace BillTraceStall.Application.Abstractions;

public interface INotificationService
{
    Task SendToUserAsync(Guid userId, string title, string body, CancellationToken ct);
    Task SendToUsersAsync(IReadOnlyCollection<Guid> userIds, string title, string body, CancellationToken ct);
}
