using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BillTraceStall.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ExpandOrderNumberUnlimited : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "OrderNumber",
                table: "Orders",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(13)",
                oldMaxLength: 13);

            migrationBuilder.Sql(
                """
                UPDATE Orders
                SET OrderNumber = CONCAT(LEFT(OrderNumber, 8), RIGHT('000000' + SUBSTRING(OrderNumber, 9, 32), 6))
                WHERE LEN(OrderNumber) = 13;
                """
            );

            migrationBuilder.AlterColumn<long>(
                name: "LastNumber",
                table: "OrderDailyCounters",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "OrderNumber",
                table: "Orders",
                type: "nvarchar(13)",
                maxLength: 13,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<int>(
                name: "LastNumber",
                table: "OrderDailyCounters",
                type: "int",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint");
        }
    }
}
