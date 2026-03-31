using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class OtpRequestConfiguration : IEntityTypeConfiguration<OtpRequest>
{
    public void Configure(EntityTypeBuilder<OtpRequest> builder)
    {
        builder.ToTable("OtpRequests");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.OtpHash).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Purpose).HasMaxLength(50).IsRequired();

        builder.Property(x => x.ExpiresAt).IsRequired();
        builder.Property(x => x.ConsumedAt);
        builder.Property(x => x.Attempts).IsRequired();

        builder.HasIndex(x => new { x.Phone, x.Purpose });
    }
}
