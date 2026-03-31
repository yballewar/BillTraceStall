using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.DTOs.Payments;
using BillTraceStall.Application.Exceptions;
using BillTraceStall.Domain.Entities;
using BillTraceStall.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BillTraceStall.Infrastructure.Services;

public sealed class PaymentService : IPaymentService
{
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;

    public PaymentService(IUnitOfWork uow, IConfiguration config)
    {
        _uow = uow;
        _config = config;
    }

    public async Task<object> CreateRazorpayOrderAsync(Guid requestingUserId, CreatePaymentRequest request, CancellationToken ct)
    {
        var bill = await _uow.Bills.Query().FirstOrDefaultAsync(x => x.Id == request.BillId, ct);
        if (bill is null)
        {
            throw new AppException("Bill not found.", 404);
        }

        if (bill.Status == BillStatus.Paid)
        {
            throw new AppException("Bill already paid.", 409);
        }

        var office = await _uow.Offices.Query().FirstOrDefaultAsync(x => x.Id == bill.OfficeId, ct);
        if (office is null || office.OfficeUserId != requestingUserId)
        {
            throw new AppException("Not allowed.", 403);
        }

        var razorpayOrderId = $"order_{Guid.NewGuid():N}";

        var payment = new Payment
        {
            BillId = bill.Id,
            PaymentGateway = "Razorpay",
            RazorpayOrderId = razorpayOrderId,
            Amount = bill.TotalAmount,
            PaymentStatus = PaymentStatus.Pending
        };

        await _uow.Payments.AddAsync(payment, ct);
        await _uow.SaveChangesAsync(ct);

        return new
        {
            key = _config["Razorpay:KeyId"] ?? "rzp_test_key",
            orderId = razorpayOrderId,
            amount = (int)(bill.TotalAmount * 100m),
            currency = "INR",
            notes = new { billId = bill.Id.ToString() }
        };
    }

    public async Task HandleRazorpayWebhookAsync(string rawBody, IDictionary<string, string> headers, CancellationToken ct)
    {
        var secret = _config["Razorpay:WebhookSecret"];
        if (!string.IsNullOrWhiteSpace(secret))
        {
            if (!headers.TryGetValue("X-Razorpay-Signature", out var signature))
            {
                headers.TryGetValue("x-razorpay-signature", out signature);
            }

            if (string.IsNullOrWhiteSpace(signature) || !VerifySignature(rawBody, signature, secret))
            {
                throw new AppException("Invalid signature.", 401);
            }
        }

        using var doc = JsonDocument.Parse(rawBody);
        var root = doc.RootElement;

        var eventName = root.TryGetProperty("event", out var ev) ? ev.GetString() : null;
        if (string.IsNullOrWhiteSpace(eventName))
        {
            return;
        }

        if (!root.TryGetProperty("payload", out var payload))
        {
            return;
        }

        var orderId = payload
            .GetProperty("payment")
            .GetProperty("entity")
            .TryGetProperty("order_id", out var orderIdEl)
            ? orderIdEl.GetString()
            : null;

        var paymentId = payload
            .GetProperty("payment")
            .GetProperty("entity")
            .TryGetProperty("id", out var paymentIdEl)
            ? paymentIdEl.GetString()
            : null;

        if (string.IsNullOrWhiteSpace(orderId))
        {
            return;
        }

        var payment = await _uow.Payments.Query().FirstOrDefaultAsync(x => x.RazorpayOrderId == orderId, ct);
        if (payment is null)
        {
            return;
        }

        if (eventName.Contains("payment.captured", StringComparison.OrdinalIgnoreCase))
        {
            payment.PaymentStatus = PaymentStatus.Success;
            payment.RazorpayPaymentId = paymentId;
            payment.PaidAt = DateTimeOffset.UtcNow;
            _uow.Payments.Update(payment);

            var bill = await _uow.Bills.Query().FirstOrDefaultAsync(x => x.Id == payment.BillId, ct);
            if (bill is not null)
            {
                bill.Status = BillStatus.Paid;
                _uow.Bills.Update(bill);
            }
        }
        else if (eventName.Contains("payment.failed", StringComparison.OrdinalIgnoreCase))
        {
            payment.PaymentStatus = PaymentStatus.Failed;
            payment.RazorpayPaymentId = paymentId;
            _uow.Payments.Update(payment);
        }

        await _uow.SaveChangesAsync(ct);
    }

    private static bool VerifySignature(string body, string signature, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
        var computed = Convert.ToHexString(hash).ToLowerInvariant();
        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(computed), Encoding.UTF8.GetBytes(signature));
    }
}
