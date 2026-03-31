SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.Designations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Designations (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Designations PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        IsActive BIT NOT NULL,
        CreatedAt DATETIMEOFFSET(7) NOT NULL
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_Designations_Name' AND object_id = OBJECT_ID('dbo.Designations')
)
BEGIN
    CREATE UNIQUE INDEX IX_Designations_Name ON dbo.Designations(Name);
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

IF COL_LENGTH('dbo.TeaStalls', 'IsActive') IS NULL
BEGIN
    ALTER TABLE dbo.TeaStalls ADD IsActive BIT NOT NULL CONSTRAINT DF_TeaStalls_IsActive DEFAULT(1);
END;

IF OBJECT_ID(N'dbo.PendingRegistrations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PendingRegistrations (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PendingRegistrations PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Phone NVARCHAR(20) NOT NULL,
        Role INT NOT NULL,
        Address NVARCHAR(500) NULL,
        DesignationName NVARCHAR(100) NULL,
        StallName NVARCHAR(200) NULL,
        StallAddress NVARCHAR(500) NULL,
        City NVARCHAR(100) NULL,
        State NVARCHAR(100) NULL,
        Pincode NVARCHAR(10) NULL,
        ExpiresAt DATETIMEOFFSET(7) NOT NULL,
        CreatedAt DATETIMEOFFSET(7) NOT NULL
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_PendingRegistrations_Phone' AND object_id = OBJECT_ID('dbo.PendingRegistrations')
)
BEGIN
    CREATE UNIQUE INDEX IX_PendingRegistrations_Phone ON dbo.PendingRegistrations(Phone);
END;
