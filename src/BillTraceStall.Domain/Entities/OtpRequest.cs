namespace BillTraceStall.Domain.Entities;

public sealed class OtpRequest : EntityBase
{
    public string Phone { get; set; } = string.Empty;

    public string OtpHash { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? ConsumedAt { get; set; }

    public int Attempts { get; set; }

    public string Purpose { get; set; } = "login";
}
