namespace BillTraceStall.Application.Abstractions;

public interface IBillingService
{
    Task GenerateMonthlyBillsAsync(int month, int year, CancellationToken ct);
}
