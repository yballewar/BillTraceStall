namespace BillTraceStall.Application.Abstractions;

public interface IOrderNumberGenerator
{
    Task<string> GenerateAsync(Guid stallId, DateTimeOffset orderTime, CancellationToken ct);
}

