using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BillTraceStall.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderNumbers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OrderNumber",
                table: "Orders",
                type: "nvarchar(13)",
                maxLength: 13,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OrderDailyCounters",
                columns: table => new
                {
                    StallId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderDate = table.Column<DateOnly>(type: "date", nullable: false),
                    LastNumber = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderDailyCounters", x => new { x.StallId, x.OrderDate });
                });

            migrationBuilder.Sql(
                """
                ;WITH Ranked AS (
                    SELECT
                        Id,
                        StallId,
                        OrderTime,
                        ROW_NUMBER() OVER (
                            PARTITION BY StallId, CONVERT(date, OrderTime)
                            ORDER BY OrderTime, Id
                        ) AS rn,
                        CONVERT(char(8), CONVERT(date, OrderTime), 112) AS d
                    FROM Orders
                )
                UPDATE o
                SET OrderNumber = CONCAT(r.d, RIGHT('00000' + CAST(r.rn AS varchar(5)), 5))
                FROM Orders o
                INNER JOIN Ranked r ON r.Id = o.Id;
                """
            );

            migrationBuilder.Sql(
                """
                INSERT INTO OrderDailyCounters (StallId, OrderDate, LastNumber)
                SELECT
                    StallId,
                    CONVERT(date, OrderTime) AS OrderDate,
                    MAX(CAST(RIGHT(OrderNumber, 5) AS int)) AS LastNumber
                FROM Orders
                GROUP BY StallId, CONVERT(date, OrderTime);
                """
            );

            migrationBuilder.AlterColumn<string>(
                name: "OrderNumber",
                table: "Orders",
                type: "nvarchar(13)",
                maxLength: 13,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(13)",
                oldMaxLength: 13,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_StallId_OrderNumber",
                table: "Orders",
                columns: new[] { "StallId", "OrderNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderDailyCounters");

            migrationBuilder.DropIndex(
                name: "IX_Orders_StallId_OrderNumber",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OrderNumber",
                table: "Orders");
        }
    }
}
