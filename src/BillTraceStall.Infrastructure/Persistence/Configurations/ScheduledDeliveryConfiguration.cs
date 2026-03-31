using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class ScheduledDeliveryConfiguration : IEntityTypeConfiguration<ScheduledDelivery>
{
    public void Configure(EntityTypeBuilder<ScheduledDelivery> builder)
    {
        builder.ToTable("ScheduledDeliveries");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.Property(x => x.StallId).IsRequired();
        builder.Property(x => x.OfficeId).IsRequired();
        builder.Property(x => x.DeliveryBoyId).IsRequired();
        builder.Property(x => x.ScheduleId).IsRequired(false);

        builder.Property(x => x.DeliveryDate).HasColumnType("date").IsRequired();
        builder.Property(x => x.DeliveryTime).HasColumnType("time").IsRequired();

        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.ApprovedByOfficeUserId).IsRequired(false);
        builder.Property(x => x.ApprovedAt).IsRequired(false);
        builder.Property(x => x.RejectedByOfficeUserId).IsRequired(false);
        builder.Property(x => x.RejectedAt).IsRequired(false);
        builder.Property(x => x.CreatedOrderId).IsRequired(false);

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

        builder.HasOne(x => x.Schedule)
            .WithMany()
            .HasForeignKey(x => x.ScheduleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Items)
            .WithOne(x => x.ScheduledDelivery)
            .HasForeignKey(x => x.ScheduledDeliveryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.StallId, x.DeliveryDate });
        builder.HasIndex(x => new { x.OfficeId, x.DeliveryDate });
        builder.HasIndex(x => new { x.DeliveryBoyId, x.DeliveryDate });
    }
}

