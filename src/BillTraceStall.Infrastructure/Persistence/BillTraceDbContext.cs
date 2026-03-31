using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.Infrastructure.Persistence;

public sealed class BillTraceDbContext : DbContext
{
    public BillTraceDbContext(DbContextOptions<BillTraceDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Designation> Designations => Set<Designation>();
    public DbSet<TeaStall> TeaStalls => Set<TeaStall>();
    public DbSet<Office> Offices => Set<Office>();
    public DbSet<DeliveryBoy> DeliveryBoys => Set<DeliveryBoy>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderDailyCounter> OrderDailyCounters => Set<OrderDailyCounter>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<ScheduledDelivery> ScheduledDeliveries => Set<ScheduledDelivery>();
    public DbSet<ScheduledDeliveryItem> ScheduledDeliveryItems => Set<ScheduledDeliveryItem>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<OtpRequest> OtpRequests => Set<OtpRequest>();
    public DbSet<PendingRegistration> PendingRegistrations => Set<PendingRegistration>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BillTraceDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries<EntityBase>())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.Id == Guid.Empty)
                {
                    entry.Entity.Id = Guid.NewGuid();
                }

                if (entry.Entity.CreatedAt == default)
                {
                    entry.Entity.CreatedAt = now;
                }
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
