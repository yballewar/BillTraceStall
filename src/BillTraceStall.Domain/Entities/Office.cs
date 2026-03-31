namespace BillTraceStall.Domain.Entities;

public sealed class Office : EntityBase
{
    public Guid StallId { get; set; }

    public Guid OfficeUserId { get; set; }

    public string OfficeName { get; set; } = string.Empty;

    public string ContactPerson { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string UniqueCode { get; set; } = string.Empty;

    public TeaStall TeaStall { get; set; } = null!;

    public User OfficeUser { get; set; } = null!;

    public List<Schedule> Schedules { get; set; } = new();
}
