using BillTraceStall.Application.DTOs.Auth;
using FluentValidation;

namespace BillTraceStall.API.Validation.Auth;

public sealed class VerifyRegistrationRequestValidator : AbstractValidator<VerifyRegistrationRequest>
{
    public VerifyRegistrationRequestValidator()
    {
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Otp).NotEmpty().Length(4, 8);
        RuleFor(x => x.Password).MaximumLength(64);
    }
}

