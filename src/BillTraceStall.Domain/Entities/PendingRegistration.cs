namespace BillTraceStall.Domain.Entities;

public sealed class PendingRegistration : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int Role { get; set; }
    public string? Address { get; set; }
    public string? DesignationName { get; set; }

    public string? StallName { get; set; }
    public string? StallAddress { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }
}

