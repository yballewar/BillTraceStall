using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class OrderDailyCounterConfiguration : IEntityTypeConfiguration<OrderDailyCounter>
{
    public void Configure(EntityTypeBuilder<OrderDailyCounter> builder)
    {
        builder.ToTable("OrderDailyCounters");
        builder.HasKey(x => new { x.StallId, x.OrderDate });

        builder.Property(x => x.StallId).IsRequired();
        builder.Property(x => x.OrderDate).HasColumnType("date").IsRequired();
        builder.Property(x => x.LastNumber).IsRequired();
    }
}
