using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class ScheduleConfiguration : IEntityTypeConfiguration<Schedule>
{
    public void Configure(EntityTypeBuilder<Schedule> builder)
    {
        builder.ToTable("Schedules");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.Property(x => x.OfficeId).IsRequired();
        builder.Property(x => x.StallId).IsRequired();

        builder.Property(x => x.DeliveryTime).HasColumnType("time").IsRequired();
        builder.Property(x => x.DaysOfWeekMask).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();

        builder.HasOne(x => x.TeaStall)
            .WithMany()
            .HasForeignKey(x => x.StallId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
