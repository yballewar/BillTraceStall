using BillTraceStall.Domain.Entities;

namespace BillTraceStall.Application.Abstractions;

public interface IUnitOfWork
{
    IGenericRepository<User> Users { get; }
    IGenericRepository<Designation> Designations { get; }
    IGenericRepository<TeaStall> TeaStalls { get; }
    IGenericRepository<Office> Offices { get; }
    IGenericRepository<DeliveryBoy> DeliveryBoys { get; }
    IGenericRepository<MenuItem> MenuItems { get; }
    IGenericRepository<Order> Orders { get; }
    IGenericRepository<OrderItem> OrderItems { get; }
    IGenericRepository<Schedule> Schedules { get; }
    IGenericRepository<ScheduledDelivery> ScheduledDeliveries { get; }
    IGenericRepository<ScheduledDeliveryItem> ScheduledDeliveryItems { get; }
    IGenericRepository<Bill> Bills { get; }
    IGenericRepository<Payment> Payments { get; }
    IGenericRepository<OtpRequest> OtpRequests { get; }
    IGenericRepository<PendingRegistration> PendingRegistrations { get; }

    Task<int> SaveChangesAsync(CancellationToken ct);
}
