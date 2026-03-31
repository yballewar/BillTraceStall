using BillTraceStall.Application.DTOs.Auth;
using FluentValidation;

namespace BillTraceStall.API.Validation.Auth;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Role).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Address).MaximumLength(500);
        RuleFor(x => x.DesignationName).MaximumLength(100);

        RuleFor(x => x.StallName).MaximumLength(200);
        RuleFor(x => x.StallAddress).MaximumLength(500);
        RuleFor(x => x.City).MaximumLength(100);
        RuleFor(x => x.State).MaximumLength(100);
        RuleFor(x => x.Pincode).MaximumLength(20);
    }
}
