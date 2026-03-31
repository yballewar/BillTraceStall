namespace BillTraceStall.Admin.Services;

public sealed class MailSettingandSend
{
    public Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        return Task.CompletedTask;
    }
}
