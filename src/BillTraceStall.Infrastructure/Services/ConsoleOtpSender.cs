using BillTraceStall.Application.Abstractions;
using Microsoft.Extensions.Logging;

namespace BillTraceStall.Infrastructure.Services;

public sealed class ConsoleOtpSender : IOtpSender
{
    private readonly ILogger<ConsoleOtpSender> _logger;

    public ConsoleOtpSender(ILogger<ConsoleOtpSender> logger)
    {
        _logger = logger;
    }

    public Task SendOtpAsync(string phone, string otp, CancellationToken ct)
    {
        _logger.LogInformation("OTP for {Phone}: {Otp}", phone, otp);
        return Task.CompletedTask;
    }
}
