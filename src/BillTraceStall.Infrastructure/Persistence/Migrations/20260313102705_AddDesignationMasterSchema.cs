using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BillTraceStall.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDesignationMasterSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
IF OBJECT_ID(N'dbo.Designations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Designations (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Designations PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        IsActive BIT NOT NULL,
        CreatedAt DATETIMEOFFSET(7) NOT NULL
    );
END;

IF COL_LENGTH('dbo.Users', 'DesignationId') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD DesignationId UNIQUEIDENTIFIER NULL;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_Users_DesignationId' AND object_id = OBJECT_ID('dbo.Users')
)
BEGIN
    CREATE INDEX IX_Users_DesignationId ON dbo.Users(DesignationId);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_Designations_Name' AND object_id = OBJECT_ID('dbo.Designations')
)
BEGIN
    CREATE UNIQUE INDEX IX_Designations_Name ON dbo.Designations(Name);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_Users_Designations_DesignationId'
)
BEGIN
    ALTER TABLE dbo.Users
        ADD CONSTRAINT FK_Users_Designations_DesignationId
            FOREIGN KEY (DesignationId)
            REFERENCES dbo.Designations(Id)
            ON DELETE NO ACTION;
END;
""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Users_Designations_DesignationId')
BEGIN
    ALTER TABLE dbo.Users DROP CONSTRAINT FK_Users_Designations_DesignationId;
END;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_Users_DesignationId' AND object_id = OBJECT_ID('dbo.Users')
)
BEGIN
    DROP INDEX IX_Users_DesignationId ON dbo.Users;
END;

IF COL_LENGTH('dbo.Users', 'DesignationId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Users DROP COLUMN DesignationId;
END;

IF OBJECT_ID(N'dbo.Designations', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Designations;
END;
""");
        }
    }
}
