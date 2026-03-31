using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BillTraceStall.Infrastructure.Persistence.Configurations;

public sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.Property(x => x.BillId).IsRequired();

        builder.Property(x => x.PaymentGateway).HasMaxLength(50).IsRequired();
        builder.Property(x => x.TransactionId).HasMaxLength(100);
        builder.Property(x => x.RazorpayOrderId).HasMaxLength(100);
        builder.Property(x => x.RazorpayPaymentId).HasMaxLength(100);

        builder.Property(x => x.Amount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(x => x.PaymentStatus).IsRequired();
        builder.Property(x => x.PaidAt);

        builder.HasIndex(x => x.RazorpayOrderId);
        builder.HasIndex(x => x.TransactionId);
    }
}
