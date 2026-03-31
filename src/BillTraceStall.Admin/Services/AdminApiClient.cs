using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace BillTraceStall.Admin.Services;

public sealed class AdminApiClient
{
    private readonly HttpClient _http;
    private readonly AdminSession _session;

    public AdminApiClient(HttpClient http, AdminSession session)
    {
        _http = http;
        _session = session;
    }

    public async Task<HttpResponseMessage> GetResponseAsync(string path, CancellationToken ct)
    {
        ApplyAuthHeader();
        return await _http.GetAsync(NormalizePath(path), ct);
    }

    public async Task<HttpResponseMessage> PostAsync<TBody>(string path, TBody body, CancellationToken ct)
    {
        ApplyAuthHeader();
        return await _http.PostAsJsonAsync(NormalizePath(path), body, ct);
    }

    public async Task<T?> GetAsync<T>(string path, CancellationToken ct)
    {
        ApplyAuthHeader();
        return await _http.GetFromJsonAsync<T>(NormalizePath(path), ct);
    }

    public async Task<HttpResponseMessage> PostAsync(string path, CancellationToken ct)
    {
        ApplyAuthHeader();
        return await _http.PostAsync(NormalizePath(path), null, ct);
    }

    public async Task<HttpResponseMessage> PutAsync<TBody>(string path, TBody body, CancellationToken ct)
    {
        ApplyAuthHeader();
        return await _http.PutAsJsonAsync(NormalizePath(path), body, ct);
    }

    private void ApplyAuthHeader()
    {
        _http.DefaultRequestHeaders.Authorization = null;
        if (!string.IsNullOrWhiteSpace(_session.AccessToken))
        {
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _session.AccessToken);
        }
    }

    private static string NormalizePath(string path)
    {
        return path.StartsWith("/", StringComparison.Ordinal) ? path.TrimStart('/') : path;
    }
}
