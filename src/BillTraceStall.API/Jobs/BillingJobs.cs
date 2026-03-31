using BillTraceStall.Application.Abstractions;

namespace BillTraceStall.API.Jobs;

public sealed class BillingJobs
{
    private readonly IBillingService _billing;

    public BillingJobs(IBillingService billing)
    {
        _billing = billing;
    }

    public Task GeneratePreviousMonthAsync()
    {
        var now = DateTime.UtcNow;
        var previous = now.AddMonths(-1);
        return _billing.GenerateMonthlyBillsAsync(previous.Month, previous.Year, CancellationToken.None);
    }
}
