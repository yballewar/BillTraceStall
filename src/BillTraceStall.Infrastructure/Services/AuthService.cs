using System.Security.Cryptography;
using System.Text;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.DTOs.Auth;
using BillTraceStall.Application.Exceptions;
using BillTraceStall.Domain.Entities;
using BillTraceStall.Domain.Enums;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BillTraceStall.Infrastructure.Services;

public sealed class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly ITokenService _tokenService;
    private readonly IOtpSender _otpSender;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IConfiguration _config;

    public AuthService(IUnitOfWork uow, ITokenService tokenService, IOtpSender otpSender, IPasswordHasher passwordHasher, IConfiguration config)
    {
        _uow = uow;
        _tokenService = tokenService;
        _otpSender = otpSender;
        _passwordHasher = passwordHasher;
        _config = config;
    }

    public async Task RequestOtpForRegistrationAsync(RegisterRequest request, CancellationToken ct)
    {
        var role = ParseRole(request.Role);
        var phone = NormalizePhone(request.Phone);

        if (role is UserRole.Admin)
        {
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            var isDev = string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase);
            var allowAdminRegistration = bool.TryParse(_config["Admin:AllowAdminRegistration"], out var allowReg) && allowReg;
            if (!allowAdminRegistration && !isDev)
            {
                throw new AppException("Admin registration is not allowed in this environment.", 403);
            }

            var allowMultipleAdmins = bool.TryParse(_config["Admin:AllowMultipleAdmins"], out var allowMulti) && allowMulti;
            var anyAdmin = await _uow.Users.Query().AnyAsync(x => x.Role == UserRole.Admin, ct);
            if (anyAdmin && !(isDev && allowMultipleAdmins))
            {
                throw new AppException("Admin already exists. Please login as Admin.", 409);
            }
        }

        var existing = await _uow.Users.Query().AnyAsync(x => x.Phone == phone, ct);
        if (existing)
        {
            throw new AppException("User already exists.", 409);
        }

        var existingPending = await _uow.PendingRegistrations.Query().FirstOrDefaultAsync(x => x.Phone == phone, ct);
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(10);
        var isNew = existingPending is null;
        existingPending ??= new PendingRegistration { Phone = phone };

        existingPending.Name = request.Name.Trim();
        existingPending.Role = (int)role;
        existingPending.Address = request.Address;
        existingPending.DesignationName = string.IsNullOrWhiteSpace(request.DesignationName) ? null : request.DesignationName.Trim();

        existingPending.StallName = string.IsNullOrWhiteSpace(request.StallName) ? null : request.StallName.Trim();
        existingPending.StallAddress = string.IsNullOrWhiteSpace(request.StallAddress) ? null : request.StallAddress.Trim();
        existingPending.City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim();
        existingPending.State = string.IsNullOrWhiteSpace(request.State) ? null : request.State.Trim();
        existingPending.Pincode = string.IsNullOrWhiteSpace(request.Pincode) ? null : request.Pincode.Trim();
        existingPending.ExpiresAt = expiresAt;

        var otpId = await CreateAndSendOtpAsync(phone, "register", ct);

        try
        {
            if (isNew)
            {
                await _uow.PendingRegistrations.AddAsync(existingPending, ct);
            }
            else
            {
                _uow.PendingRegistrations.Update(existingPending);
            }

            await _uow.SaveChangesAsync(ct);
        }
        catch
        {
            var createdOtp = await _uow.OtpRequests.GetByIdAsync(otpId, ct);
            if (createdOtp is not null)
            {
                _uow.OtpRequests.Remove(createdOtp);
                await _uow.SaveChangesAsync(ct);
            }

            throw;
        }
    }

    public async Task<(bool Sent, int StatusCode, string? Error)> RequestOtpForLoginAsync(LoginRequest request, CancellationToken ct)
    {
        var phone = NormalizePhone(request.Phone);
        var user = await _uow.Users.Query().FirstOrDefaultAsync(x => x.Phone == phone, ct);
        if (user is null)
        {
            return (false, 404, "User not found. Please register.");
        }

        if (!user.IsActive)
        {
            return (false, 403, "User is inactive.");
        }

        if (user.Role == UserRole.Admin)
        {
            return (false, 403, "Admin login uses password. OTP login is not allowed.");
        }

        await CreateAndSendOtpAsync(phone, "login", ct);
        return (true, 202, null);
    }

    public async Task<AuthResult> VerifyOtpAsync(VerifyOtpRequest request, CancellationToken ct)
    {
        var phone = NormalizePhone(request.Phone);
        var userExists = await _uow.Users.Query().AnyAsync(x => x.Phone == phone, ct);
        if (!userExists)
        {
            var pending = await _uow.PendingRegistrations.Query().FirstOrDefaultAsync(x => x.Phone == phone, ct);
            if (pending is not null)
            {
                var created = await VerifyRegistrationInternalAsync(phone, request.Otp, password: null, ct);
                return created;
            }
        }

        var otp = await _uow.OtpRequests.Query()
            .Where(x => x.Phone == phone && x.Purpose == "login" && x.ConsumedAt == null)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (otp is null)
        {
            throw new AppException("OTP not found.", 400);
        }

        if (otp.ExpiresAt < DateTimeOffset.UtcNow)
        {
            throw new AppException("OTP expired.", 400);
        }

        if (otp.Attempts >= 5)
        {
            throw new AppException("Too many attempts.", 429);
        }

        var inputHash = ComputeOtpHash(phone, request.Otp, otp.Purpose);
        if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(otp.OtpHash), Encoding.UTF8.GetBytes(inputHash)))
        {
            otp.Attempts += 1;
            _uow.OtpRequests.Update(otp);
            await _uow.SaveChangesAsync(ct);
            throw new AppException("Invalid OTP.", 400);
        }

        otp.ConsumedAt = DateTimeOffset.UtcNow;
        _uow.OtpRequests.Update(otp);

        var user = await _uow.Users.Query().FirstOrDefaultAsync(x => x.Phone == phone, ct);
        if (user is null)
        {
            throw new AppException("User not found.", 404);
        }

        await _uow.SaveChangesAsync(ct);

        var (token, expiresAt) = _tokenService.CreateAccessToken(user);
        return new AuthResult(token, expiresAt, user.Role.ToString());
    }

    public async Task<AuthResult> VerifyRegistrationAsync(VerifyRegistrationRequest request, CancellationToken ct)
    {
        var phone = NormalizePhone(request.Phone);
        return await VerifyRegistrationInternalAsync(phone, request.Otp, request.Password, ct);
    }

    public async Task<AuthResult> LoginWithPasswordAsync(PasswordLoginRequest request, CancellationToken ct)
    {
        var phone = NormalizePhone(request.Phone);
        var user = await _uow.Users.Query().FirstOrDefaultAsync(x => x.Phone == phone, ct);
        if (user is null)
        {
            throw new AppException("User not found.", 404);
        }

        if (!user.IsActive)
        {
            throw new AppException("User is inactive.", 403);
        }

        if (user.Role != UserRole.Admin)
        {
            throw new AppException("This login is only for company employees (Admin).", 403);
        }

        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            throw new AppException("Password not set. Verify OTP once and set password.", 400);
        }

        var ok = _passwordHasher.Verify(request.Password, user.PasswordHash);
        if (!ok)
        {
            throw new AppException("Invalid credentials.", 400);
        }

        var (token, expiresAt) = _tokenService.CreateAccessToken(user);
        return new AuthResult(token, expiresAt, user.Role.ToString());
    }

    public async Task SetPasswordAsync(Guid userId, SetPasswordRequest request, CancellationToken ct)
    {
        var user = await _uow.Users.Query().FirstOrDefaultAsync(x => x.Id == userId, ct);
        if (user is null)
        {
            throw new AppException("User not found.", 404);
        }

        if (user.Role != UserRole.Admin)
        {
            throw new AppException("Password setup is allowed only for company employees (Admin).", 403);
        }

        user.PasswordHash = _passwordHasher.Hash(request.Password);
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync(ct);
    }

    private async Task<Guid> CreateAndSendOtpAsync(string phone, string purpose, CancellationToken ct)
    {
        var otp = RandomNumberGenerator.GetInt32(0, 999999).ToString("D6");
        var useFixed = bool.TryParse(_config["Otp:UseFixed"], out var alwaysUseFixed) && alwaysUseFixed;
        if (!useFixed)
        {
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            useFixed = string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase)
                       && bool.TryParse(_config["Otp:UseFixedInDevelopment"], out var enabled)
                       && enabled;
        }

        if (useFixed)
        {
            var fixedOtp = _config["Otp:FixedCode"];
            if (!string.IsNullOrWhiteSpace(fixedOtp) && fixedOtp.Length == 6)
            {
                var allDigits = true;
                foreach (var ch in fixedOtp)
                {
                    if (ch < '0' || ch > '9')
                    {
                        allDigits = false;
                        break;
                    }
                }

                if (allDigits)
                {
                    otp = fixedOtp;
                }
            }
        }

        await _otpSender.SendOtpAsync(phone, otp, ct);

        var otpEntity = new OtpRequest
        {
            Id = Guid.NewGuid(),
            Phone = phone,
            Purpose = purpose,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(5),
            Attempts = 0,
            OtpHash = ComputeOtpHash(phone, otp, purpose)
        };

        await _uow.OtpRequests.AddAsync(otpEntity, ct);
        await _uow.SaveChangesAsync(ct);
        return otpEntity.Id;
    }

    private async Task<AuthResult> VerifyRegistrationInternalAsync(string phone, string otpInput, string? password, CancellationToken ct)
    {
        var pending = await _uow.PendingRegistrations.Query().FirstOrDefaultAsync(x => x.Phone == phone, ct);
        if (pending is null)
        {
            throw new AppException("Registration not found. Please register again.", 404);
        }

        if (pending.ExpiresAt < DateTimeOffset.UtcNow)
        {
            _uow.PendingRegistrations.Remove(pending);
            await _uow.SaveChangesAsync(ct);
            throw new AppException("Registration expired. Please register again.", 400);
        }

        var otp = await _uow.OtpRequests.Query()
            .Where(x => x.Phone == phone && x.Purpose == "register" && x.ConsumedAt == null)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (otp is null)
        {
            throw new AppException("OTP not found.", 400);
        }

        if (otp.ExpiresAt < DateTimeOffset.UtcNow)
        {
            throw new AppException("OTP expired.", 400);
        }

        if (otp.Attempts >= 5)
        {
            throw new AppException("Too many attempts.", 429);
        }

        var inputHash = ComputeOtpHash(phone, otpInput, otp.Purpose);
        if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(otp.OtpHash), Encoding.UTF8.GetBytes(inputHash)))
        {
            otp.Attempts += 1;
            _uow.OtpRequests.Update(otp);
            await _uow.SaveChangesAsync(ct);
            throw new AppException("Invalid OTP.", 400);
        }

        var exists = await _uow.Users.Query().AnyAsync(x => x.Phone == phone, ct);
        if (exists)
        {
            throw new AppException("User already exists. Please login.", 409);
        }

        var role = (UserRole)pending.Role;
        Guid? designationId = null;

        if (role == UserRole.Admin)
        {
            if (string.IsNullOrWhiteSpace(pending.DesignationName))
            {
                throw new AppException("Designation is required.", 400);
            }

            var des = await _uow.Designations.Query()
                .FirstOrDefaultAsync(x => x.Name == pending.DesignationName && x.IsActive, ct);
            if (des is null)
            {
                throw new AppException("Invalid designation.", 400);
            }
            designationId = des.Id;

            if (string.IsNullOrWhiteSpace(password))
            {
                throw new AppException("Password is required.", 400);
            }
        }
        else if (!string.IsNullOrWhiteSpace(pending.DesignationName))
        {
            var name = pending.DesignationName.Trim();
            var des = await _uow.Designations.Query().FirstOrDefaultAsync(x => x.Name == name, ct);
            if (des is null)
            {
                des = new Designation { Name = name, IsActive = true };
                await _uow.Designations.AddAsync(des, ct);
                await _uow.SaveChangesAsync(ct);
            }
            designationId = des.Id;
        }

        var user = new User
        {
            Name = pending.Name,
            Phone = pending.Phone,
            Role = role,
            DesignationId = designationId,
            Address = pending.Address,
            PasswordHash = role == UserRole.Admin ? _passwordHasher.Hash(password!) : null,
            IsActive = true
        };

        otp.ConsumedAt = DateTimeOffset.UtcNow;
        _uow.OtpRequests.Update(otp);
        await _uow.Users.AddAsync(user, ct);
        _uow.PendingRegistrations.Remove(pending);
        await _uow.SaveChangesAsync(ct);

        if (role == UserRole.TeaStallOwner
            && !string.IsNullOrWhiteSpace(pending.StallName)
            && !string.IsNullOrWhiteSpace(pending.StallAddress)
            && !string.IsNullOrWhiteSpace(pending.City)
            && !string.IsNullOrWhiteSpace(pending.State)
            && !string.IsNullOrWhiteSpace(pending.Pincode))
        {
            var stallExists = await _uow.TeaStalls.Query().AnyAsync(x => x.OwnerId == user.Id, ct);
            if (!stallExists)
            {
                var uniqueCode = $"TS{Random.Shared.Next(100000, 999999)}";
                await _uow.TeaStalls.AddAsync(new TeaStall
                {
                    OwnerId = user.Id,
                    StallName = pending.StallName.Trim(),
                    Address = pending.StallAddress.Trim(),
                    City = pending.City.Trim(),
                    State = pending.State.Trim(),
                    Pincode = pending.Pincode.Trim(),
                    UniqueCode = uniqueCode,
                    IsApproved = false
                }, ct);
                await _uow.SaveChangesAsync(ct);
            }
        }

        var (token, expiresAt) = _tokenService.CreateAccessToken(user);
        return new AuthResult(token, expiresAt, user.Role.ToString());
    }

    private string ComputeOtpHash(string phone, string otp, string purpose)
    {
        var key = _config["Otp:Key"] ?? "dev-otp-secret";
        var input = $"{purpose}|{phone}|{otp}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var bytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }

    private static string NormalizePhone(string phone)
    {
        return (phone ?? string.Empty).Trim();
    }

    private static bool IsUniquePhoneViolation(DbUpdateException ex)
    {
        if (ex.InnerException is not SqlException sqlEx)
        {
            return false;
        }

        return sqlEx.Number is 2601 or 2627;
    }

    private static UserRole ParseRole(string role)
    {
        if (Enum.TryParse<UserRole>(role, ignoreCase: true, out var parsed))
        {
            return parsed;
        }

        return role.ToUpperInvariant() switch
        {
            "ADMIN" => UserRole.Admin,
            "TEA_STALL" => UserRole.TeaStallOwner,
            "DELIVERY_BOY" => UserRole.DeliveryBoy,
            _ => throw new AppException("Invalid role.", 400)
        };
    }
}
