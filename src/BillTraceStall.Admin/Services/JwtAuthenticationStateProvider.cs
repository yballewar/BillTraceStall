using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Server.ProtectedBrowserStorage;

namespace BillTraceStall.Admin.Services;

public sealed class JwtAuthenticationStateProvider : AuthenticationStateProvider
{
    private readonly ProtectedLocalStorage _storage;
    private ClaimsPrincipal _principal = new(new ClaimsIdentity());

    public JwtAuthenticationStateProvider(ProtectedLocalStorage storage)
    {
        _storage = storage;
    }

    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        try
        {
            var storedToken = await _storage.GetAsync<string>("auth_token");
            var token = storedToken.Success ? storedToken.Value : null;
            if (!string.IsNullOrWhiteSpace(token))
            {
                _principal = BuildPrincipalFromToken(token);
                return new AuthenticationState(_principal);
            }
        }
        catch
        {
        }

        _principal = new ClaimsPrincipal(new ClaimsIdentity());
        return new AuthenticationState(_principal);
    }

    public Task MarkUserAsAuthenticatedAsync(string token, string contactNumber)
    {
        _principal = BuildPrincipalFromToken(token);
        NotifyAuthenticationStateChanged(Task.FromResult(new AuthenticationState(_principal)));
        return Task.CompletedTask;
    }

    public Task MarkUserAsLoggedOutAsync()
    {
        _principal = new ClaimsPrincipal(new ClaimsIdentity());
        NotifyAuthenticationStateChanged(Task.FromResult(new AuthenticationState(_principal)));
        return Task.CompletedTask;
    }

    private static ClaimsPrincipal BuildPrincipalFromToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);
            var identity = new ClaimsIdentity(jwt.Claims, authenticationType: "jwt");
            return new ClaimsPrincipal(identity);
        }
        catch
        {
            return new ClaimsPrincipal(new ClaimsIdentity());
        }
    }
}
