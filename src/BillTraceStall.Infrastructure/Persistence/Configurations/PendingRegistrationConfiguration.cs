using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class PendingRegistrationConfiguration : IEntityTypeConfiguration<PendingRegistration>
{
    public void Configure(EntityTypeBuilder<PendingRegistration> builder)
    {
        builder.ToTable("PendingRegistrations");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.ExpiresAt).IsRequired();

        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Role).IsRequired();

        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.DesignationName).HasMaxLength(100);

        builder.Property(x => x.StallName).HasMaxLength(200);
        builder.Property(x => x.StallAddress).HasMaxLength(500);
        builder.Property(x => x.City).HasMaxLength(100);
        builder.Property(x => x.State).HasMaxLength(100);
        builder.Property(x => x.Pincode).HasMaxLength(10);

        builder.HasIndex(x => x.Phone).IsUnique();
    }
}

