namespace BillTraceStall.Admin.Services;

public interface IAuthCacheService
{
    Task<string?> GetAsync(string contactNumber, CancellationToken ct);
    Task SetAsync(string contactNumber, string token, DateTimeOffset expiresAt, CancellationToken ct);
    void Clear();
}
