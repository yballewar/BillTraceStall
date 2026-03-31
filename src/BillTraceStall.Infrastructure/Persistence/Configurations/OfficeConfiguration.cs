using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class OfficeConfiguration : IEntityTypeConfiguration<Office>
{
    public void Configure(EntityTypeBuilder<Office> builder)
    {
        builder.ToTable("Offices");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.Property(x => x.StallId).IsRequired();
        builder.Property(x => x.OfficeUserId).IsRequired();

        builder.Property(x => x.OfficeName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.ContactPerson).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Address).HasMaxLength(500).IsRequired();

        builder.Property(x => x.UniqueCode).HasMaxLength(20).IsRequired();
        builder.HasIndex(x => x.UniqueCode).IsUnique();

        builder.HasOne(x => x.OfficeUser)
            .WithMany()
            .HasForeignKey(x => x.OfficeUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Schedules)
            .WithOne(x => x.Office)
            .HasForeignKey(x => x.OfficeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
