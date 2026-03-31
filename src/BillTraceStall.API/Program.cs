using System.Text;
using Asp.Versioning;
using BillTraceStall.API.Jobs;
using BillTraceStall.API.Hubs;
using BillTraceStall.API.Services;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Infrastructure.Security;
using BillTraceStall.Infrastructure.Services;
using BillTraceStall.Infrastructure.Persistence;
using BillTraceStall.Infrastructure.Repositories;
using FluentValidation;
using FluentValidation.AspNetCore;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.DependencyInjection;
using QuestPDF.Infrastructure;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

QuestPDF.Settings.License = LicenseType.Community;

builder.Host.UseSerilog((ctx, cfg) =>
{
    cfg.ReadFrom.Configuration(ctx.Configuration);
});

builder.Configuration.AddJsonFile("appsettings.json", optional: true)
                     .AddEnvironmentVariables();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
});

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
});

var connectionString = builder.Configuration.GetConnectionString("SqlServer") 
                       ?? "Server=localhost;Database=BillTraceStall;User Id=sa;Password=Your_password123;TrustServerCertificate=True;";

EnsureSqlServerDatabaseExists(connectionString);

var dbCommandTimeoutSeconds = builder.Configuration.GetValue<int?>("Database:CommandTimeoutSeconds") ?? 180;

builder.Services.AddDbContext<BillTraceDbContext>(opt =>
    opt.UseSqlServer(connectionString, sql =>
    {
        sql.EnableRetryOnFailure();
        sql.CommandTimeout(dbCommandTimeoutSeconds);
    }));

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IOtpSender, ConsoleOtpSender>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITeaStallService, TeaStallService>();
builder.Services.AddScoped<IOfficeService, OfficeService>();
builder.Services.AddScoped<IOrderNumberGenerator, OrderNumberGenerator>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IDeliveryService, DeliveryService>();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IRealtimeService, RealtimeService>();

builder.Services.AddHangfire(cfg =>
{
    cfg.SetDataCompatibilityLevel(CompatibilityLevel.Version_180);
    cfg.UseSimpleAssemblyNameTypeSerializer();
    cfg.UseRecommendedSerializerSettings();
    cfg.UseSqlServerStorage(connectionString, new SqlServerStorageOptions
    {
        PrepareSchemaIfNecessary = true
    });
});
builder.Services.AddHangfireServer();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "dev-super-secret-key-min-32-chars";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "BillTraceStall";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "BillTraceStall.Mobile";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var accessToken = ctx.Request.Query["access_token"];
                var path = ctx.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && (path.StartsWithSegments("/hubs/orders") || path.StartsWithSegments("/api/v1/office/report")))
                {
                    ctx.Token = accessToken;
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = ctx =>
            {
                var logger = ctx.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("JwtBearer");
                logger.LogWarning(ctx.Exception, "JWT authentication failed for {Path}", ctx.HttpContext.Request.Path);
                return Task.CompletedTask;
            },
            OnChallenge = ctx =>
            {
                var logger = ctx.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("JwtBearer");
                logger.LogInformation("JWT challenge for {Path}. Error={Error} Desc={Desc}", ctx.HttpContext.Request.Path, ctx.Error, ctx.ErrorDescription);
                return Task.CompletedTask;
            }
        };
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", p => p.RequireRole("Admin"));
    options.AddPolicy("TeaStallOwner", p => p.RequireRole("TeaStallOwner"));
    options.AddPolicy("DeliveryBoy", p => p.RequireRole("DeliveryBoy"));
    options.AddPolicy("Office", p => p.RequireRole("Office"));
});

builder.Services.AddOpenApi();

var app = builder.Build();

var autoMigrate = builder.Configuration.GetValue<bool?>("Database:AutoMigrate") ?? false;
if (autoMigrate)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BillTraceDbContext>();
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Database migration failed");
    }
}

app.UseSerilogRequestLogging();
app.UseRouting();
app.UseMiddleware<BillTraceStall.API.Middleware.ErrorHandlingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [new HangfireAdminAuthorizationFilter()]
});

try
{
    RecurringJob.AddOrUpdate<BillingJobs>("billing-monthly", j => j.GeneratePreviousMonthAsync(), Cron.Monthly(1, 0));
}
catch (Exception ex)
{
    Log.Error(ex, "Hangfire recurring job registration failed");
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
    app.MapGet("/", () => Results.Redirect("/swagger"));
}

app.MapControllers();
app.MapHub<OrdersHub>("/hubs/orders");

app.Run();

static void EnsureSqlServerDatabaseExists(string connectionString)
{
    var csb = new SqlConnectionStringBuilder(connectionString);
    if (string.IsNullOrWhiteSpace(csb.InitialCatalog))
    {
        return;
    }

    var dbName = csb.InitialCatalog;
    var masterCsb = new SqlConnectionStringBuilder(connectionString)
    {
        InitialCatalog = "master"
    };

    using var conn = new SqlConnection(masterCsb.ConnectionString);
    conn.Open();
    using var cmd = conn.CreateCommand();
    cmd.CommandText = """
IF DB_ID(@db) IS NULL
BEGIN
    DECLARE @sql nvarchar(max) = N'CREATE DATABASE ' + QUOTENAME(@db);
    EXEC(@sql);
END
""";
    cmd.Parameters.AddWithValue("@db", dbName);
    cmd.ExecuteNonQuery();
}
