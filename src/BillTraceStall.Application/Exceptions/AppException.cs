namespace BillTraceStall.Application.Exceptions;

public sealed class AppException : Exception
{
    public AppException(string message, int statusCode) : base(message)
    {
        StatusCode = statusCode;
    }

    public int StatusCode { get; }
}
