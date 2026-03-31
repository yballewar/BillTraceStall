using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BillTraceStall.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduledDeliveries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ScheduledDeliveries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StallId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OfficeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DeliveryBoyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeliveryDate = table.Column<DateOnly>(type: "date", nullable: false),
                    DeliveryTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ApprovedByOfficeUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ApprovedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RejectedByOfficeUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RejectedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CreatedOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduledDeliveries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScheduledDeliveries_DeliveryBoys_DeliveryBoyId",
                        column: x => x.DeliveryBoyId,
                        principalTable: "DeliveryBoys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScheduledDeliveries_Offices_OfficeId",
                        column: x => x.OfficeId,
                        principalTable: "Offices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScheduledDeliveries_Schedules_ScheduleId",
                        column: x => x.ScheduleId,
                        principalTable: "Schedules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScheduledDeliveries_TeaStalls_StallId",
                        column: x => x.StallId,
                        principalTable: "TeaStalls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ScheduledDeliveryItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ScheduledDeliveryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MenuItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduledDeliveryItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScheduledDeliveryItems_MenuItems_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ScheduledDeliveryItems_ScheduledDeliveries_ScheduledDeliveryId",
                        column: x => x.ScheduledDeliveryId,
                        principalTable: "ScheduledDeliveries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledDeliveries_DeliveryBoyId_DeliveryDate",
                table: "ScheduledDeliveries",
                columns: new[] { "DeliveryBoyId", "DeliveryDate" });

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledDeliveries_OfficeId_DeliveryDate",
                table: "ScheduledDeliveries",
                columns: new[] { "OfficeId", "DeliveryDate" });

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledDeliveries_ScheduleId",
                table: "ScheduledDeliveries",
                column: "ScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledDeliveries_StallId_DeliveryDate",
                table: "ScheduledDeliveries",
                columns: new[] { "StallId", "DeliveryDate" });

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledDeliveryItems_MenuItemId",
                table: "ScheduledDeliveryItems",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledDeliveryItems_ScheduledDeliveryId",
                table: "ScheduledDeliveryItems",
                column: "ScheduledDeliveryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ScheduledDeliveryItems");

            migrationBuilder.DropTable(
                name: "ScheduledDeliveries");
        }
    }
}
