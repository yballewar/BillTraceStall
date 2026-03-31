# BillTraceStall

BillTraceStall is a multi-tenant delivery + monthly billing platform connecting Tea Stalls with Corporate Offices.

## Solution structure

- [BillTraceStall.API](file:///e:/BillTraceStall/src/BillTraceStall.API) (.NET 9 Web API)
- [BillTraceStall.Admin](file:///e:/BillTraceStall/src/BillTraceStall.Admin) (Blazor Server Admin)
- [BillTraceStall.Domain](file:///e:/BillTraceStall/src/BillTraceStall.Domain) (Entities + enums)
- [BillTraceStall.Application](file:///e:/BillTraceStall/src/BillTraceStall.Application) (DTOs + abstractions)
- [BillTraceStall.Infrastructure](file:///e:/BillTraceStall/src/BillTraceStall.Infrastructure) (EF Core + services)
- [mobile](file:///e:/BillTraceStall/mobile) (Expo React Native app)

## Run in Visual Studio (recommended)

1. Open [BillTraceStall.sln](file:///e:/BillTraceStall/BillTraceStall.sln)
2. Set multiple startup projects:
   - BillTraceStall.API
   - BillTraceStall.Admin
3. Ensure SQL Server 2019 is available and apply schema:
   - DB name: `BillTraceStall`
   - Default instance: `.\SQLEXPRESS` (configured in API appsettings)
   - SQL script: [init.sql](file:///e:/BillTraceStall/src/BillTraceStall.Infrastructure/Sql/init.sql)
4. Press F5 to run both projects

Default URLs:
- API: http://localhost:5191
- Swagger: http://localhost:5191/swagger
- Hangfire: http://localhost:5191/hangfire
- Admin (Blazor): http://localhost:5000 (or IIS Express url)

Connection string (API):
- [appsettings.json](file:///e:/BillTraceStall/src/BillTraceStall.API/appsettings.json) defaults to `Server=.\SQLEXPRESS;Database=BillTraceStall;Trusted_Connection=True;...`

Troubleshooting:
- If you see `Cannot open database "BillTraceStall" requested by the login`, run [init.sql](file:///e:/BillTraceStall/src/BillTraceStall.Infrastructure/Sql/init.sql) (it creates the DB + tables) or grant your Windows login access to the DB.

## Run from CLI (optional)

```powershell
cd e:\BillTraceStall
dotnet build

cd e:\BillTraceStall\src\BillTraceStall.API
dotnet run

cd e:\BillTraceStall\src\BillTraceStall.Admin
dotnet run
```

## Authentication flow (OTP + JWT)

- `POST /api/v1/auth/register` → creates user and sends OTP (dev sender logs OTP in API logs)
- `POST /api/v1/auth/login` → sends OTP
- `POST /api/v1/auth/verify-otp` → returns JWT access token

## Mobile app

```powershell
cd e:\BillTraceStall\mobile
npm install
notepad .env
npm run android
```

Env notes:
- Android emulator uses `http://10.0.2.2:5191/api/v1`
- Real Android phone uses `http://<YOUR_PC_LAN_IP>:5191/api/v1` and PC + phone must be on same Wi-Fi
