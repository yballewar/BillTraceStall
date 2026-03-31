using BillTraceStall.Application.DTOs.Auth;
using FluentValidation;

namespace BillTraceStall.API.Validation.Auth;

public sealed class VerifyOtpRequestValidator : AbstractValidator<VerifyOtpRequest>
{
    public VerifyOtpRequestValidator()
    {
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Otp).NotEmpty().Length(4, 8);
    }
}
