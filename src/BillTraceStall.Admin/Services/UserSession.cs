namespace BillTraceStall.Admin.Services;

public sealed class UserSession
{
    public string? Token { get; set; }
    public string? ContactNumber { get; set; }
    public DateTime? LoginTime { get; set; }
    public int EmployeeId { get; set; }

    public event Action? OnChange;

    public void NotifyStateChanged()
    {
        OnChange?.Invoke();
    }

    public void Clear()
    {
        Token = null;
        ContactNumber = null;
        LoginTime = null;
        EmployeeId = 0;
        NotifyStateChanged();
    }
}
