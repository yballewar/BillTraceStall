using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class TeaStallConfiguration : IEntityTypeConfiguration<TeaStall>
{
    public void Configure(EntityTypeBuilder<TeaStall> builder)
    {
        builder.ToTable("TeaStalls");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.Property(x => x.OwnerId).IsRequired();
        builder.Property(x => x.StallName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Address).HasMaxLength(500).IsRequired();
        builder.Property(x => x.City).HasMaxLength(100).IsRequired();
        builder.Property(x => x.State).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Pincode).HasMaxLength(10).IsRequired();

        builder.Property(x => x.UniqueCode).HasMaxLength(20).IsRequired();
        builder.HasIndex(x => x.UniqueCode).IsUnique();

        builder.Property(x => x.IsApproved).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();

        builder.HasMany(x => x.Offices)
            .WithOne(x => x.TeaStall)
            .HasForeignKey(x => x.StallId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.DeliveryBoys)
            .WithOne(x => x.TeaStall)
            .HasForeignKey(x => x.StallId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.MenuItems)
            .WithOne(x => x.TeaStall)
            .HasForeignKey(x => x.StallId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
