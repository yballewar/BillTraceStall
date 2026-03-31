using BillTraceStall.Application.DTOs.Auth;
using FluentValidation;

namespace BillTraceStall.API.Validation.Auth;

public sealed class SetPasswordRequestValidator : AbstractValidator<SetPasswordRequest>
{
    public SetPasswordRequestValidator()
    {
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).MaximumLength(64);
    }
}

