namespace BillTraceStall.Application.Abstractions;

public interface IOtpSender
{
    Task SendOtpAsync(string phone, string otp, CancellationToken ct);
}
