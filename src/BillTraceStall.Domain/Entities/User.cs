using BillTraceStall.Domain.Enums;

namespace BillTraceStall.Domain.Entities;

public sealed class User : EntityBase
{
    public string Name { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public Guid? DesignationId { get; set; }

    public Designation? Designation { get; set; }

    public string? Address { get; set; }

    public string? PasswordHash { get; set; }

    public bool IsActive { get; set; } = true;

    public string? FcmToken { get; set; }

    public TeaStall? OwnedTeaStall { get; set; }
}
