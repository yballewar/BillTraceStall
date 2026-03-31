using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.HasIndex(x => x.Phone).IsUnique();

        builder.Property(x => x.DesignationId).IsRequired(false);

        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.PasswordHash).HasMaxLength(500);
        builder.Property(x => x.FcmToken).HasMaxLength(512);

        builder.Property(x => x.Role).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();

        builder.HasOne(x => x.OwnedTeaStall)
            .WithOne(x => x.Owner)
            .HasForeignKey<TeaStall>(x => x.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Designation)
            .WithMany()
            .HasForeignKey(x => x.DesignationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
