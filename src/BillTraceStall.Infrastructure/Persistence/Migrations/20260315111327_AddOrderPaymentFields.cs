using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BillTraceStall.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderPaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PaymentMode",
                table: "Orders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "PaymentReceived",
                table: "Orders",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "PaymentReceivedAt",
                table: "Orders",
                type: "datetimeoffset",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentMode",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentReceived",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentReceivedAt",
                table: "Orders");
        }
    }
}
