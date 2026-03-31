using System.Collections.Concurrent;

namespace BillTraceStall.Admin.Services;

public sealed class MemoryAuthCacheService : IAuthCacheService
{
    private readonly ConcurrentDictionary<string, CacheEntry> _cache = new(StringComparer.OrdinalIgnoreCase);

    public Task<string?> GetAsync(string contactNumber, CancellationToken ct)
    {
        if (_cache.TryGetValue(contactNumber, out var entry))
        {
            if (entry.ExpiresAt > DateTimeOffset.UtcNow)
            {
                return Task.FromResult<string?>(entry.Token);
            }

            _cache.TryRemove(contactNumber, out _);
        }

        return Task.FromResult<string?>(null);
    }

    public Task SetAsync(string contactNumber, string token, DateTimeOffset expiresAt, CancellationToken ct)
    {
        _cache[contactNumber] = new CacheEntry(token, expiresAt);
        return Task.CompletedTask;
    }

    public void Clear()
    {
        _cache.Clear();
    }

    private sealed record CacheEntry(string Token, DateTimeOffset ExpiresAt);
}
