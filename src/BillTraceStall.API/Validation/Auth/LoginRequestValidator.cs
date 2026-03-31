using BillTraceStall.Application.DTOs.Auth;
using FluentValidation;

namespace BillTraceStall.API.Validation.Auth;

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
    }
}
