IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE TABLE [OtpRequests] (
        [Id] uniqueidentifier NOT NULL,
        [Phone] nvarchar(20) NOT NULL,
        [OtpHash] nvarchar(200) NOT NULL,
        [ExpiresAt] datetimeoffset NOT NULL,
        [ConsumedAt] datetimeoffset NULL,
        [Attempts] int NOT NULL,
        [Purpose] nvarchar(50) NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_OtpRequests] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Phone] nvarchar(20) NOT NULL,
        [Role] int NOT NULL,
        [Address] nvarchar(500) NULL,
        [PasswordHash] nvarchar(500) NULL,
        [IsActive] bit NOT NULL,
        [FcmToken] nvarchar(512) NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE TABLE [TeaStalls] (
        [Id] uniqueidentifier NOT NULL,
        [OwnerId] uniqueidentifier NOT NULL,
        [StallName] nvarchar(200) NOT NULL,
        [Address] nvarchar(500) NOT NULL,
        [City] nvarchar(100) NOT NULL,
        [State] nvarchar(100) NOT NULL,
        [Pincode] nvarchar(10) NOT NULL,
        [UniqueCode] nvarchar(20) NOT NULL,
        [IsApproved] bit NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_TeaStalls] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TeaStalls_Users_OwnerId] FOREIGN KEY ([OwnerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE TABLE [DeliveryBoys] (
        [Id] uniqueidentifier NOT NULL,
        [StallId] uniqueidentifier NOT NULL,
        [DeliveryUserId] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Phone] nvarchar(20) NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_DeliveryBoys] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DeliveryBoys_TeaStalls_StallId] FOREIGN KEY ([StallId]) REFERENCES [TeaStalls] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_DeliveryBoys_Users_DeliveryUserId] FOREIGN KEY ([DeliveryUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE TABLE [MenuItems] (
        [Id] uniqueidentifier NOT NULL,
        [StallId] uniqueidentifier NOT NULL,
        [ItemName] nvarchar(200) NOT NULL,
        [Price] decimal(18,2) NOT NULL,
        [Category] nvarchar(100) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_MenuItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MenuItems_TeaStalls_StallId] FOREIGN KEY ([StallId]) REFERENCES [TeaStalls] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE TABLE [Offices] (
        [Id] uniqueidentifier NOT NULL,
        [StallId] uniqueidentifier NOT NULL,
        [OfficeUserId] uniqueidentifier NOT NULL,
        [OfficeName] nvarchar(200) NOT NULL,
        [ContactPerson] nvarchar(200) NOT NULL,
        [Phone] nvarchar(20) NOT NULL,
        [Address] nvarchar(500) NOT NULL,
        [UniqueCode] nvarchar(20) NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_Offices] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Offices_TeaStalls_StallId] FOREIGN KEY ([StallId]) REFERENCES [TeaStalls] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Offices_Users_OfficeUserId] FOREIGN KEY ([OfficeUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE TABLE [Bills] (
        [Id] uniqueidentifier NOT NULL,
        [StallId] uniqueidentifier NOT NULL,
        [OfficeId] uniqueidentifier NOT NULL,
        [Month] int NOT NULL,
        [Year] int NOT NULL,
        [TotalAmount] decimal(18,2) NOT NULL,
        [Status] int NOT NULL,
        [GeneratedAt] datetimeoffset NOT NULL,
        [TeaStallId] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_Bills] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Bills_Offices_OfficeId] FOREIGN KEY ([OfficeId]) REFERENCES [Offices] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Bills_TeaStalls_TeaStallId] FOREIGN KEY ([TeaStallId]) REFERENCES [TeaStalls] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE TABLE [Orders] (
        [Id] uniqueidentifier NOT NULL,
        [StallId] uniqueidentifier NOT NULL,
        [OfficeId] uniqueidentifier NOT NULL,
        [DeliveryBoyId] uniqueidentifier NULL,
        [OrderType] int NOT NULL,
        [OrderTime] datetimeoffset NOT NULL,
        [Status] int NOT NULL,
        [TeaStallId] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_Orders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Orders_DeliveryBoys_DeliveryBoyId] FOREIGN KEY ([DeliveryBoyId]) REFERENCES [DeliveryBoys] ([Id]),
        CONSTRAINT [FK_Orders_Offices_OfficeId] FOREIGN KEY ([OfficeId]) REFERENCES [Offices] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Orders_TeaStalls_TeaStallId] FOREIGN KEY ([TeaStallId]) REFERENCES [TeaStalls] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE TABLE [Schedules] (
        [Id] uniqueidentifier NOT NULL,
        [OfficeId] uniqueidentifier NOT NULL,
        [StallId] uniqueidentifier NOT NULL,
        [DeliveryTime] time NOT NULL,
        [DaysOfWeekMask] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_Schedules] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Schedules_Offices_OfficeId] FOREIGN KEY ([OfficeId]) REFERENCES [Offices] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Schedules_TeaStalls_StallId] FOREIGN KEY ([StallId]) REFERENCES [TeaStalls] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE TABLE [Payments] (
        [Id] uniqueidentifier NOT NULL,
        [BillId] uniqueidentifier NOT NULL,
        [PaymentGateway] nvarchar(50) NOT NULL,
        [TransactionId] nvarchar(100) NULL,
        [RazorpayOrderId] nvarchar(100) NULL,
        [RazorpayPaymentId] nvarchar(100) NULL,
        [Amount] decimal(18,2) NOT NULL,
        [PaymentStatus] int NOT NULL,
        [PaidAt] datetimeoffset NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Payments_Bills_BillId] FOREIGN KEY ([BillId]) REFERENCES [Bills] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE TABLE [OrderItems] (
        [Id] uniqueidentifier NOT NULL,
        [OrderId] uniqueidentifier NOT NULL,
        [MenuItemId] uniqueidentifier NOT NULL,
        [Quantity] int NOT NULL,
        [Price] decimal(18,2) NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_OrderItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OrderItems_MenuItems_MenuItemId] FOREIGN KEY ([MenuItemId]) REFERENCES [MenuItems] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_OrderItems_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Bills_OfficeId_Month_Year] ON [Bills] ([OfficeId], [Month], [Year]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Bills_TeaStallId] ON [Bills] ([TeaStallId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DeliveryBoys_DeliveryUserId] ON [DeliveryBoys] ([DeliveryUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_DeliveryBoys_StallId_Phone] ON [DeliveryBoys] ([StallId], [Phone]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MenuItems_StallId_ItemName] ON [MenuItems] ([StallId], [ItemName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Offices_OfficeUserId] ON [Offices] ([OfficeUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Offices_StallId] ON [Offices] ([StallId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Offices_UniqueCode] ON [Offices] ([UniqueCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OrderItems_MenuItemId] ON [OrderItems] ([MenuItemId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OrderItems_OrderId] ON [OrderItems] ([OrderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Orders_DeliveryBoyId_OrderTime] ON [Orders] ([DeliveryBoyId], [OrderTime]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Orders_OfficeId] ON [Orders] ([OfficeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Orders_StallId_OrderTime] ON [Orders] ([StallId], [OrderTime]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Orders_TeaStallId] ON [Orders] ([TeaStallId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OtpRequests_Phone_Purpose] ON [OtpRequests] ([Phone], [Purpose]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Payments_BillId] ON [Payments] ([BillId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Payments_RazorpayOrderId] ON [Payments] ([RazorpayOrderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Payments_TransactionId] ON [Payments] ([TransactionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Schedules_OfficeId] ON [Schedules] ([OfficeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Schedules_StallId] ON [Schedules] ([StallId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TeaStalls_OwnerId] ON [TeaStalls] ([OwnerId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TeaStalls_UniqueCode] ON [TeaStalls] ([UniqueCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Phone] ON [Users] ([Phone]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312153529_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260312153529_InitialCreate', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260312204158_AddDesignationMaster'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260312204158_AddDesignationMaster', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260313102705_AddDesignationMasterSchema'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260313102705_AddDesignationMasterSchema'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260313102705_AddDesignationMasterSchema', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260313112018_AddPendingRegistrations'
)
BEGIN
    CREATE TABLE [PendingRegistrations] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Phone] nvarchar(20) NOT NULL,
        [Role] int NOT NULL,
        [Address] nvarchar(500) NULL,
        [DesignationName] nvarchar(100) NULL,
        [StallName] nvarchar(200) NULL,
        [StallAddress] nvarchar(500) NULL,
        [City] nvarchar(100) NULL,
        [State] nvarchar(100) NULL,
        [Pincode] nvarchar(10) NULL,
        [ExpiresAt] datetimeoffset NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_PendingRegistrations] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260313112018_AddPendingRegistrations'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PendingRegistrations_Phone] ON [PendingRegistrations] ([Phone]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260313112018_AddPendingRegistrations'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260313112018_AddPendingRegistrations', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315111327_AddOrderPaymentFields'
)
BEGIN
    ALTER TABLE [Orders] ADD [PaymentMode] int NOT NULL DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315111327_AddOrderPaymentFields'
)
BEGIN
    ALTER TABLE [Orders] ADD [PaymentReceived] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315111327_AddOrderPaymentFields'
)
BEGIN
    ALTER TABLE [Orders] ADD [PaymentReceivedAt] datetimeoffset NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315111327_AddOrderPaymentFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260315111327_AddOrderPaymentFields', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315123156_AddScheduledDeliveries'
)
BEGIN
    CREATE TABLE [ScheduledDeliveries] (
        [Id] uniqueidentifier NOT NULL,
        [StallId] uniqueidentifier NOT NULL,
        [OfficeId] uniqueidentifier NOT NULL,
        [DeliveryBoyId] uniqueidentifier NOT NULL,
        [ScheduleId] uniqueidentifier NULL,
        [DeliveryDate] date NOT NULL,
        [DeliveryTime] time NOT NULL,
        [Status] int NOT NULL,
        [ApprovedByOfficeUserId] uniqueidentifier NULL,
        [ApprovedAt] datetimeoffset NULL,
        [RejectedByOfficeUserId] uniqueidentifier NULL,
        [RejectedAt] datetimeoffset NULL,
        [CreatedOrderId] uniqueidentifier NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_ScheduledDeliveries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ScheduledDeliveries_DeliveryBoys_DeliveryBoyId] FOREIGN KEY ([DeliveryBoyId]) REFERENCES [DeliveryBoys] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ScheduledDeliveries_Offices_OfficeId] FOREIGN KEY ([OfficeId]) REFERENCES [Offices] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ScheduledDeliveries_Schedules_ScheduleId] FOREIGN KEY ([ScheduleId]) REFERENCES [Schedules] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ScheduledDeliveries_TeaStalls_StallId] FOREIGN KEY ([StallId]) REFERENCES [TeaStalls] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315123156_AddScheduledDeliveries'
)
BEGIN
    CREATE TABLE [ScheduledDeliveryItems] (
        [Id] uniqueidentifier NOT NULL,
        [ScheduledDeliveryId] uniqueidentifier NOT NULL,
        [MenuItemId] uniqueidentifier NOT NULL,
        [Quantity] int NOT NULL,
        [Price] decimal(18,2) NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_ScheduledDeliveryItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ScheduledDeliveryItems_MenuItems_MenuItemId] FOREIGN KEY ([MenuItemId]) REFERENCES [MenuItems] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ScheduledDeliveryItems_ScheduledDeliveries_ScheduledDeliveryId] FOREIGN KEY ([ScheduledDeliveryId]) REFERENCES [ScheduledDeliveries] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315123156_AddScheduledDeliveries'
)
BEGIN
    CREATE INDEX [IX_ScheduledDeliveries_DeliveryBoyId_DeliveryDate] ON [ScheduledDeliveries] ([DeliveryBoyId], [DeliveryDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315123156_AddScheduledDeliveries'
)
BEGIN
    CREATE INDEX [IX_ScheduledDeliveries_OfficeId_DeliveryDate] ON [ScheduledDeliveries] ([OfficeId], [DeliveryDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315123156_AddScheduledDeliveries'
)
BEGIN
    CREATE INDEX [IX_ScheduledDeliveries_ScheduleId] ON [ScheduledDeliveries] ([ScheduleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315123156_AddScheduledDeliveries'
)
BEGIN
    CREATE INDEX [IX_ScheduledDeliveries_StallId_DeliveryDate] ON [ScheduledDeliveries] ([StallId], [DeliveryDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315123156_AddScheduledDeliveries'
)
BEGIN
    CREATE INDEX [IX_ScheduledDeliveryItems_MenuItemId] ON [ScheduledDeliveryItems] ([MenuItemId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315123156_AddScheduledDeliveries'
)
BEGIN
    CREATE INDEX [IX_ScheduledDeliveryItems_ScheduledDeliveryId] ON [ScheduledDeliveryItems] ([ScheduledDeliveryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315123156_AddScheduledDeliveries'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260315123156_AddScheduledDeliveries', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315180136_AddOrderNumbers'
)
BEGIN
    ALTER TABLE [Orders] ADD [OrderNumber] nvarchar(13) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315180136_AddOrderNumbers'
)
BEGIN
    CREATE TABLE [OrderDailyCounters] (
        [StallId] uniqueidentifier NOT NULL,
        [OrderDate] date NOT NULL,
        [LastNumber] int NOT NULL,
        CONSTRAINT [PK_OrderDailyCounters] PRIMARY KEY ([StallId], [OrderDate])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315180136_AddOrderNumbers'
)
BEGIN
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
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315180136_AddOrderNumbers'
)
BEGIN
    INSERT INTO OrderDailyCounters (StallId, OrderDate, LastNumber)
    SELECT
        StallId,
        CONVERT(date, OrderTime) AS OrderDate,
        MAX(CAST(RIGHT(OrderNumber, 5) AS int)) AS LastNumber
    FROM Orders
    GROUP BY StallId, CONVERT(date, OrderTime);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315180136_AddOrderNumbers'
)
BEGIN
    DECLARE @var sysname;
    SELECT @var = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Orders]') AND [c].[name] = N'OrderNumber');
    IF @var IS NOT NULL EXEC(N'ALTER TABLE [Orders] DROP CONSTRAINT [' + @var + '];');
    ALTER TABLE [Orders] ALTER COLUMN [OrderNumber] nvarchar(13) NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315180136_AddOrderNumbers'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Orders_StallId_OrderNumber] ON [Orders] ([StallId], [OrderNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315180136_AddOrderNumbers'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260315180136_AddOrderNumbers', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315181258_ExpandOrderNumberUnlimited'
)
BEGIN
    DROP INDEX [IX_Orders_StallId_OrderNumber] ON [Orders];
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Orders]') AND [c].[name] = N'OrderNumber');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Orders] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [Orders] ALTER COLUMN [OrderNumber] nvarchar(32) NOT NULL;
    CREATE UNIQUE INDEX [IX_Orders_StallId_OrderNumber] ON [Orders] ([StallId], [OrderNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315181258_ExpandOrderNumberUnlimited'
)
BEGIN
    UPDATE Orders
    SET OrderNumber = CONCAT(LEFT(OrderNumber, 8), RIGHT('000000' + SUBSTRING(OrderNumber, 9, 32), 6))
    WHERE LEN(OrderNumber) = 13;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315181258_ExpandOrderNumberUnlimited'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[OrderDailyCounters]') AND [c].[name] = N'LastNumber');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [OrderDailyCounters] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [OrderDailyCounters] ALTER COLUMN [LastNumber] bigint NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315181258_ExpandOrderNumberUnlimited'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260315181258_ExpandOrderNumberUnlimited', N'9.0.3');
END;

COMMIT;
GO

