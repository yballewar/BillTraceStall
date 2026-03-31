using BillTraceStall.Application.Abstractions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Net.Http.Json;

namespace BillTraceStall.Infrastructure.Services;

public sealed class NotificationService : INotificationService
{
    private readonly IUnitOfWork _uow;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<NotificationService> _logger;
    private readonly IConfiguration _config;

    public NotificationService(IUnitOfWork uow, IHttpClientFactory httpClientFactory, ILogger<NotificationService> logger, IConfiguration config)
    {
        _uow = uow;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _config = config;
    }

    public async Task SendToUserAsync(Guid userId, string title, string body, CancellationToken ct)
    {
        await SendToUsersAsync([userId], title, body, ct);
    }

    public async Task SendToUsersAsync(IReadOnlyCollection<Guid> userIds, string title, string body, CancellationToken ct)
    {
        if (userIds.Count == 0)
        {
            return;
        }

        var tokens = await _uow.Users.Query()
            .Where(x => userIds.Contains(x.Id))
            .Select(x => x.FcmToken)
            .ToListAsync(ct);

        var distinctTokens = tokens
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (distinctTokens.Count == 0)
        {
            return;
        }

        var enabled = _config.GetValue<bool?>("Push:Enabled") ?? true;
        if (!enabled)
        {
            _logger.LogInformation("Push disabled; skipped sending {Count} notifications", distinctTokens.Count);
            return;
        }

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);

        var messages = distinctTokens.Select(t => new
        {
            to = t,
            title,
            body,
            sound = "default"
        }).ToList();

        try
        {
            var res = await client.PostAsJsonAsync("https://exp.host/--/api/v2/push/send", messages, ct);
            if (!res.IsSuccessStatusCode)
            {
                var text = await res.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Expo push failed: {Status} {Body}", (int)res.StatusCode, text);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Expo push failed");
        }
    }
}
