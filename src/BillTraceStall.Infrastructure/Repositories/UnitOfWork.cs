using BillTraceStall.Application.Abstractions;
using BillTraceStall.Domain.Entities;
using BillTraceStall.Infrastructure.Persistence;

namespace BillTraceStall.Infrastructure.Repositories;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly BillTraceDbContext _db;

    public UnitOfWork(BillTraceDbContext db)
    {
        _db = db;

        Users = new GenericRepository<User>(_db);
        Designations = new GenericRepository<Designation>(_db);
        TeaStalls = new GenericRepository<TeaStall>(_db);
        Offices = new GenericRepository<Office>(_db);
        DeliveryBoys = new GenericRepository<DeliveryBoy>(_db);
        MenuItems = new GenericRepository<MenuItem>(_db);
        Orders = new GenericRepository<Order>(_db);
        OrderItems = new GenericRepository<OrderItem>(_db);
        Schedules = new GenericRepository<Schedule>(_db);
        ScheduledDeliveries = new GenericRepository<ScheduledDelivery>(_db);
        ScheduledDeliveryItems = new GenericRepository<ScheduledDeliveryItem>(_db);
        Bills = new GenericRepository<Bill>(_db);
        Payments = new GenericRepository<Payment>(_db);
        OtpRequests = new GenericRepository<OtpRequest>(_db);
        PendingRegistrations = new GenericRepository<PendingRegistration>(_db);
    }

    public IGenericRepository<User> Users { get; }
    public IGenericRepository<Designation> Designations { get; }
    public IGenericRepository<TeaStall> TeaStalls { get; }
    public IGenericRepository<Office> Offices { get; }
    public IGenericRepository<DeliveryBoy> DeliveryBoys { get; }
    public IGenericRepository<MenuItem> MenuItems { get; }
    public IGenericRepository<Order> Orders { get; }
    public IGenericRepository<OrderItem> OrderItems { get; }
    public IGenericRepository<Schedule> Schedules { get; }
    public IGenericRepository<ScheduledDelivery> ScheduledDeliveries { get; }
    public IGenericRepository<ScheduledDeliveryItem> ScheduledDeliveryItems { get; }
    public IGenericRepository<Bill> Bills { get; }
    public IGenericRepository<Payment> Payments { get; }
    public IGenericRepository<OtpRequest> OtpRequests { get; }
    public IGenericRepository<PendingRegistration> PendingRegistrations { get; }

    public Task<int> SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);
}
