namespace BillTraceStall.Domain.Entities;

public sealed class Designation : EntityBase
{
    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

