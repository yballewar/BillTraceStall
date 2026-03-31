using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class ScheduledDeliveryItemConfiguration : IEntityTypeConfiguration<ScheduledDeliveryItem>
{
    public void Configure(EntityTypeBuilder<ScheduledDeliveryItem> builder)
    {
        builder.ToTable("ScheduledDeliveryItems");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.Property(x => x.ScheduledDeliveryId).IsRequired();
        builder.Property(x => x.MenuItemId).IsRequired();
        builder.Property(x => x.Quantity).IsRequired();
        builder.Property(x => x.Price).HasColumnType("decimal(18,2)").IsRequired();

        builder.HasIndex(x => x.ScheduledDeliveryId);
        builder.HasIndex(x => x.MenuItemId);
    }
}

