using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.Property(x => x.StallId).IsRequired();
        builder.Property(x => x.OfficeId).IsRequired();

        builder.Property(x => x.OrderNumber).HasMaxLength(32).IsRequired();
        builder.Property(x => x.OrderType).IsRequired();
        builder.Property(x => x.OrderTime).IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.PaymentReceived).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.PaymentMode).IsRequired().HasDefaultValue(BillTraceStall.Domain.Enums.PaymentMode.Credit);
        builder.Property(x => x.PaymentReceivedAt);

        builder.HasOne(x => x.TeaStall)
            .WithMany()
            .HasForeignKey(x => x.StallId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Office)
            .WithMany()
            .HasForeignKey(x => x.OfficeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.DeliveryBoy)
            .WithMany()
            .HasForeignKey(x => x.DeliveryBoyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.StallId, x.OrderTime });
        builder.HasIndex(x => new { x.DeliveryBoyId, x.OrderTime });
        builder.HasIndex(x => new { x.StallId, x.OrderNumber }).IsUnique();

        builder.HasMany(x => x.Items)
            .WithOne(x => x.Order)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
