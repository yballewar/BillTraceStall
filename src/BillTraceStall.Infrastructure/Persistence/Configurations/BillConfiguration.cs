using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class BillConfiguration : IEntityTypeConfiguration<Bill>
{
    public void Configure(EntityTypeBuilder<Bill> builder)
    {
        builder.ToTable("Bills");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.Property(x => x.StallId).IsRequired();
        builder.Property(x => x.OfficeId).IsRequired();

        builder.Property(x => x.Month).IsRequired();
        builder.Property(x => x.Year).IsRequired();

        builder.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.GeneratedAt).IsRequired();

        builder.HasIndex(x => new { x.OfficeId, x.Month, x.Year }).IsUnique();

        builder.HasMany(x => x.Payments)
            .WithOne(x => x.Bill)
            .HasForeignKey(x => x.BillId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
