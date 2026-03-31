IF DB_ID(N'BillTraceStall') IS NULL
BEGIN
    CREATE DATABASE [BillTraceStall];
END
GO

USE [BillTraceStall];
GO

IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NULL
BEGIN
CREATE TABLE [Users](
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIMEOFFSET NOT NULL,
    [Name] NVARCHAR(200) NOT NULL,
    [Phone] NVARCHAR(20) NOT NULL,
    [Role] INT NOT NULL,
    [Address] NVARCHAR(500) NULL,
    [PasswordHash] NVARCHAR(500) NULL,
    [IsActive] BIT NOT NULL,
    [FcmToken] NVARCHAR(512) NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
    CONSTRAINT [UQ_Users_Phone] UNIQUE ([Phone])
);
END
GO

IF OBJECT_ID(N'[dbo].[TeaStalls]', N'U') IS NULL
BEGIN
CREATE TABLE [TeaStalls](
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIMEOFFSET NOT NULL,
    [OwnerId] UNIQUEIDENTIFIER NOT NULL,
    [StallName] NVARCHAR(200) NOT NULL,
    [Address] NVARCHAR(500) NOT NULL,
    [City] NVARCHAR(100) NOT NULL,
    [State] NVARCHAR(100) NOT NULL,
    [Pincode] NVARCHAR(10) NOT NULL,
    [UniqueCode] NVARCHAR(20) NOT NULL,
    [IsApproved] BIT NOT NULL,
    CONSTRAINT [PK_TeaStalls] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TeaStalls_Users] FOREIGN KEY ([OwnerId]) REFERENCES [Users]([Id]),
    CONSTRAINT [UQ_TeaStalls_UniqueCode] UNIQUE ([UniqueCode])
);
END
GO

IF OBJECT_ID(N'[dbo].[Offices]', N'U') IS NULL
BEGIN
CREATE TABLE [Offices](
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIMEOFFSET NOT NULL,
    [StallId] UNIQUEIDENTIFIER NOT NULL,
    [OfficeUserId] UNIQUEIDENTIFIER NOT NULL,
    [OfficeName] NVARCHAR(200) NOT NULL,
    [ContactPerson] NVARCHAR(200) NOT NULL,
    [Phone] NVARCHAR(20) NOT NULL,
    [Address] NVARCHAR(500) NOT NULL,
    [UniqueCode] NVARCHAR(20) NOT NULL,
    CONSTRAINT [PK_Offices] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Offices_TeaStalls] FOREIGN KEY ([StallId]) REFERENCES [TeaStalls]([Id]),
    CONSTRAINT [FK_Offices_Users] FOREIGN KEY ([OfficeUserId]) REFERENCES [Users]([Id]),
    CONSTRAINT [UQ_Offices_UniqueCode] UNIQUE ([UniqueCode])
);
END
GO

IF OBJECT_ID(N'[dbo].[DeliveryBoys]', N'U') IS NULL
BEGIN
CREATE TABLE [DeliveryBoys](
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIMEOFFSET NOT NULL,
    [StallId] UNIQUEIDENTIFIER NOT NULL,
    [DeliveryUserId] UNIQUEIDENTIFIER NOT NULL,
    [Name] NVARCHAR(200) NOT NULL,
    [Phone] NVARCHAR(20) NOT NULL,
    CONSTRAINT [PK_DeliveryBoys] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DeliveryBoys_TeaStalls] FOREIGN KEY ([StallId]) REFERENCES [TeaStalls]([Id]),
    CONSTRAINT [FK_DeliveryBoys_Users] FOREIGN KEY ([DeliveryUserId]) REFERENCES [Users]([Id])
);
END
GO

IF OBJECT_ID(N'[dbo].[MenuItems]', N'U') IS NULL
BEGIN
CREATE TABLE [MenuItems](
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIMEOFFSET NOT NULL,
    [StallId] UNIQUEIDENTIFIER NOT NULL,
    [ItemName] NVARCHAR(200) NOT NULL,
    [Price] DECIMAL(18,2) NOT NULL,
    [Category] NVARCHAR(100) NOT NULL,
    [IsActive] BIT NOT NULL,
    CONSTRAINT [PK_MenuItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MenuItems_TeaStalls] FOREIGN KEY ([StallId]) REFERENCES [TeaStalls]([Id])
);
END
GO

IF OBJECT_ID(N'[dbo].[Orders]', N'U') IS NULL
BEGIN
CREATE TABLE [Orders](
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIMEOFFSET NOT NULL,
    [StallId] UNIQUEIDENTIFIER NOT NULL,
    [OfficeId] UNIQUEIDENTIFIER NOT NULL,
    [DeliveryBoyId] UNIQUEIDENTIFIER NULL,
    [OrderType] INT NOT NULL,
    [OrderTime] DATETIMEOFFSET NOT NULL,
    [Status] INT NOT NULL,
    CONSTRAINT [PK_Orders] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Orders_TeaStalls] FOREIGN KEY ([StallId]) REFERENCES [TeaStalls]([Id]),
    CONSTRAINT [FK_Orders_Offices] FOREIGN KEY ([OfficeId]) REFERENCES [Offices]([Id]),
    CONSTRAINT [FK_Orders_DeliveryBoys] FOREIGN KEY ([DeliveryBoyId]) REFERENCES [DeliveryBoys]([Id])
);
END
GO

IF OBJECT_ID(N'[dbo].[OrderItems]', N'U') IS NULL
BEGIN
CREATE TABLE [OrderItems](
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIMEOFFSET NOT NULL,
    [OrderId] UNIQUEIDENTIFIER NOT NULL,
    [MenuItemId] UNIQUEIDENTIFIER NOT NULL,
    [Quantity] INT NOT NULL,
    [Price] DECIMAL(18,2) NOT NULL,
    CONSTRAINT [PK_OrderItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_OrderItems_Orders] FOREIGN KEY ([OrderId]) REFERENCES [Orders]([Id]),
    CONSTRAINT [FK_OrderItems_MenuItems] FOREIGN KEY ([MenuItemId]) REFERENCES [MenuItems]([Id])
);
END
GO

IF OBJECT_ID(N'[dbo].[Schedules]', N'U') IS NULL
BEGIN
CREATE TABLE [Schedules](
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIMEOFFSET NOT NULL,
    [OfficeId] UNIQUEIDENTIFIER NOT NULL,
    [StallId] UNIQUEIDENTIFIER NOT NULL,
    [DeliveryTime] TIME NOT NULL,
    [DaysOfWeekMask] INT NOT NULL,
    [IsActive] BIT NOT NULL,
    CONSTRAINT [PK_Schedules] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Schedules_Offices] FOREIGN KEY ([OfficeId]) REFERENCES [Offices]([Id]),
    CONSTRAINT [FK_Schedules_TeaStalls] FOREIGN KEY ([StallId]) REFERENCES [TeaStalls]([Id])
);
END
GO

IF OBJECT_ID(N'[dbo].[Bills]', N'U') IS NULL
BEGIN
CREATE TABLE [Bills](
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIMEOFFSET NOT NULL,
    [StallId] UNIQUEIDENTIFIER NOT NULL,
    [OfficeId] UNIQUEIDENTIFIER NOT NULL,
    [Month] INT NOT NULL,
    [Year] INT NOT NULL,
    [TotalAmount] DECIMAL(18,2) NOT NULL,
    [Status] INT NOT NULL,
    [GeneratedAt] DATETIMEOFFSET NOT NULL,
    CONSTRAINT [PK_Bills] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Bills_TeaStalls] FOREIGN KEY ([StallId]) REFERENCES [TeaStalls]([Id]),
    CONSTRAINT [FK_Bills_Offices] FOREIGN KEY ([OfficeId]) REFERENCES [Offices]([Id]),
    CONSTRAINT [UQ_Bills_Office_Month_Year] UNIQUE ([OfficeId], [Month], [Year])
);
END
GO

IF OBJECT_ID(N'[dbo].[Payments]', N'U') IS NULL
BEGIN
CREATE TABLE [Payments](
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIMEOFFSET NOT NULL,
    [BillId] UNIQUEIDENTIFIER NOT NULL,
    [PaymentGateway] NVARCHAR(50) NOT NULL,
    [TransactionId] NVARCHAR(100) NULL,
    [RazorpayOrderId] NVARCHAR(100) NULL,
    [RazorpayPaymentId] NVARCHAR(100) NULL,
    [Amount] DECIMAL(18,2) NOT NULL,
    [PaymentStatus] INT NOT NULL,
    [PaidAt] DATETIMEOFFSET NULL,
    CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Payments_Bills] FOREIGN KEY ([BillId]) REFERENCES [Bills]([Id])
);
END
GO

IF OBJECT_ID(N'[dbo].[OtpRequests]', N'U') IS NULL
BEGIN
CREATE TABLE [OtpRequests](
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt] DATETIMEOFFSET NOT NULL,
    [Phone] NVARCHAR(20) NOT NULL,
    [OtpHash] NVARCHAR(200) NOT NULL,
    [ExpiresAt] DATETIMEOFFSET NOT NULL,
    [ConsumedAt] DATETIMEOFFSET NULL,
    [Attempts] INT NOT NULL,
    [Purpose] NVARCHAR(50) NOT NULL,
    CONSTRAINT [PK_OtpRequests] PRIMARY KEY ([Id])
);
END
GO
