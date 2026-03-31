using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using BillTraceStall.Application.DTOs.Auth;

namespace BillTraceStall.Admin.Services;

public sealed class AuthService
{
    private readonly IHttpClientFactory _clientFactory;
    private readonly IAuthCacheService _cache;

    public AuthService(IHttpClientFactory clientFactory, IAuthCacheService cache)
    {
        _clientFactory = clientFactory;
        _cache = cache;
    }

    public async Task<string?> GetCachedTokenAsync(string contactNumber, CancellationToken ct = default)
    {
        return await _cache.GetAsync(contactNumber, ct);
    }

    public async Task<string?> LoginAsync(string contactNumber, string passwordOrOtp, CancellationToken ct = default)
    {
        var (token, _) = await LoginWithErrorAsync(contactNumber, passwordOrOtp, ct);
        return token;
    }

    public async Task<(string? token, string? errorMessage)> LoginWithErrorAsync(string contactNumber, string passwordOrOtp, CancellationToken ct = default)
    {
        var cached = await _cache.GetAsync(contactNumber, ct);
        if (!string.IsNullOrWhiteSpace(cached))
        {
            return (cached, null);
        }

        var client = _clientFactory.CreateClient("api");

        try
        {
            await client.PostAsJsonAsync("auth/login", new { phone = contactNumber }, ct);
        }
        catch
        {
        }

        var response = await client.PostAsJsonAsync("auth/verify-otp", new { phone = contactNumber, otp = passwordOrOtp }, ct);
        if (!response.IsSuccessStatusCode)
        {
            var text = await response.Content.ReadAsStringAsync(ct);
            return (null, string.IsNullOrWhiteSpace(text) ? "Invalid credentials." : text);
        }

        var payload = await response.Content.ReadFromJsonAsync<AuthResult>(cancellationToken: ct);
        if (payload is null || string.IsNullOrWhiteSpace(payload.AccessToken))
        {
            return (null, "Login failed.");
        }

        var expiresAt = payload.ExpiresAt;
        if (expiresAt == default)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(payload.AccessToken);
                expiresAt = new DateTimeOffset(jwt.ValidTo, TimeSpan.Zero);
            }
            catch
            {
                expiresAt = DateTimeOffset.UtcNow.AddMinutes(30);
            }
        }

        await _cache.SetAsync(contactNumber, payload.AccessToken, expiresAt, ct);
        return (payload.AccessToken, null);
    }

    public async Task<(string? token, string? errorMessage)> LoginWithPasswordWithErrorAsync(string contactNumber, string password, CancellationToken ct = default)
    {
        var cached = await _cache.GetAsync(contactNumber, ct);
        if (!string.IsNullOrWhiteSpace(cached))
        {
            return (cached, null);
        }

        var client = _clientFactory.CreateClient("api");
        var response = await client.PostAsJsonAsync("auth/login-password", new { phone = contactNumber, password }, ct);
        if (!response.IsSuccessStatusCode)
        {
            var text = await response.Content.ReadAsStringAsync(ct);
            return (null, string.IsNullOrWhiteSpace(text) ? "Invalid credentials." : text);
        }

        var payload = await response.Content.ReadFromJsonAsync<AuthResult>(cancellationToken: ct);
        if (payload is null || string.IsNullOrWhiteSpace(payload.AccessToken))
        {
            return (null, "Login failed.");
        }

        var expiresAt = payload.ExpiresAt;
        if (expiresAt == default)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(payload.AccessToken);
                expiresAt = new DateTimeOffset(jwt.ValidTo, TimeSpan.Zero);
            }
            catch
            {
                expiresAt = DateTimeOffset.UtcNow.AddMinutes(30);
            }
        }

        await _cache.SetAsync(contactNumber, payload.AccessToken, expiresAt, ct);
        return (payload.AccessToken, null);
    }

    public async Task<(string? token, string? errorMessage)> VerifyOtpOnlyWithErrorAsync(string contactNumber, string otp, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient("api");
        var response = await client.PostAsJsonAsync("auth/verify-otp", new { phone = contactNumber, otp }, ct);
        if (!response.IsSuccessStatusCode)
        {
            var text = await response.Content.ReadAsStringAsync(ct);
            return (null, string.IsNullOrWhiteSpace(text) ? "Invalid OTP." : text);
        }

        var payload = await response.Content.ReadFromJsonAsync<AuthResult>(cancellationToken: ct);
        if (payload is null || string.IsNullOrWhiteSpace(payload.AccessToken))
        {
            return (null, "Verification failed.");
        }

        return (payload.AccessToken, null);
    }

    public async Task<(string? token, string? errorMessage)> VerifyRegistrationWithErrorAsync(string contactNumber, string otp, string password, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient("api");
        var response = await client.PostAsJsonAsync("auth/verify-registration", new { phone = contactNumber, otp, password }, ct);
        if (!response.IsSuccessStatusCode)
        {
            var text = await response.Content.ReadAsStringAsync(ct);
            return (null, string.IsNullOrWhiteSpace(text) ? "Verification failed." : text);
        }

        var payload = await response.Content.ReadFromJsonAsync<AuthResult>(cancellationToken: ct);
        if (payload is null || string.IsNullOrWhiteSpace(payload.AccessToken))
        {
            return (null, "Verification failed.");
        }

        return (payload.AccessToken, null);
    }

    public async Task<(bool ok, string? errorMessage)> SetPasswordAsync(string token, string password, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient("api");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsJsonAsync("auth/set-password", new { password }, ct);
        if (!response.IsSuccessStatusCode)
        {
            var text = await response.Content.ReadAsStringAsync(ct);
            return (false, string.IsNullOrWhiteSpace(text) ? "Set password failed." : text);
        }

        return (true, null);
    }
}
