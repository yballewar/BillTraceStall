using BillTraceStall.Domain.Entities;

namespace BillTraceStall.Application.Abstractions;

public interface ITokenService
{
    (string token, DateTimeOffset expiresAt) CreateAccessToken(User user);
}
