using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class DeliveryBoyConfiguration : IEntityTypeConfiguration<DeliveryBoy>
{
    public void Configure(EntityTypeBuilder<DeliveryBoy> builder)
    {
        builder.ToTable("DeliveryBoys");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.Property(x => x.StallId).IsRequired();
        builder.Property(x => x.DeliveryUserId).IsRequired();

        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.HasIndex(x => new { x.StallId, x.Phone }).IsUnique();

        builder.HasOne(x => x.DeliveryUser)
            .WithMany()
            .HasForeignKey(x => x.DeliveryUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
