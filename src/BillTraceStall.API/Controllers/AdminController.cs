using Asp.Versioning;
using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.Exceptions;
using BillTraceStall.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/admin")]
[ApiVersion("1.0")]
[Authorize(Policy = "Admin")]
public sealed class AdminController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IPasswordHasher _passwordHasher;

    public AdminController(IUnitOfWork uow, IPasswordHasher passwordHasher)
    {
        _uow = uow;
        _passwordHasher = passwordHasher;
    }

    [HttpGet("tea-stalls/pending")]
    public async Task<IActionResult> PendingTeaStalls(CancellationToken ct)
    {
        var data = await _uow.TeaStalls.Query()
            .Where(x => !x.IsApproved)
            .Join(_uow.Users.Query(), s => s.OwnerId, u => u.Id, (s, u) => new
            {
                s.Id,
                s.StallName,
                s.Address,
                s.City,
                s.State,
                s.Pincode,
                s.UniqueCode,
                OwnerPhone = u.Phone,
                s.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(data);
    }

    [HttpGet("tea-stalls/active")]
    public async Task<IActionResult> ApprovedTeaStalls(CancellationToken ct)
    {
        var data = await _uow.TeaStalls.Query()
            .Where(x => x.IsApproved && x.IsActive)
            .Join(_uow.Users.Query(), s => s.OwnerId, u => u.Id, (s, u) => new
            {
                s.Id,
                s.StallName,
                s.Address,
                s.City,
                s.State,
                s.Pincode,
                s.UniqueCode,
                s.IsActive,
                OwnerPhone = u.Phone,
                s.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(data);
    }

    [HttpGet("tea-stalls/approved")]
    public async Task<IActionResult> ApprovedAllTeaStalls(CancellationToken ct)
    {
        var data = await _uow.TeaStalls.Query()
            .Where(x => x.IsApproved)
            .Join(_uow.Users.Query(), s => s.OwnerId, u => u.Id, (s, u) => new
            {
                s.Id,
                s.StallName,
                s.Address,
                s.City,
                s.State,
                s.Pincode,
                s.UniqueCode,
                s.IsActive,
                OwnerPhone = u.Phone,
                s.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(data);
    }

    [HttpGet("tea-stalls/stopped")]
    public async Task<IActionResult> StoppedTeaStalls(CancellationToken ct)
    {
        var data = await _uow.TeaStalls.Query()
            .Where(x => x.IsApproved && !x.IsActive)
            .Join(_uow.Users.Query(), s => s.OwnerId, u => u.Id, (s, u) => new
            {
                s.Id,
                s.StallName,
                s.Address,
                s.City,
                s.State,
                s.Pincode,
                s.UniqueCode,
                OwnerPhone = u.Phone,
                s.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(data);
    }

    [HttpPost("tea-stalls/{id:guid}/approve")]
    public async Task<IActionResult> ApproveTeaStall(Guid id, CancellationToken ct)
    {
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        stall.IsApproved = true;
        stall.IsActive = true;
        _uow.TeaStalls.Update(stall);
        await _uow.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpPut("tea-stalls/{id:guid}")]
    public async Task<IActionResult> UpdateTeaStall(Guid id, [FromBody] UpdateTeaStallRequest request, CancellationToken ct)
    {
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        if (string.IsNullOrWhiteSpace(request.StallName)
            || string.IsNullOrWhiteSpace(request.Address)
            || string.IsNullOrWhiteSpace(request.City)
            || string.IsNullOrWhiteSpace(request.State)
            || string.IsNullOrWhiteSpace(request.Pincode))
        {
            throw new AppException("All fields are required.", 400);
        }

        stall.StallName = request.StallName.Trim();
        stall.Address = request.Address.Trim();
        stall.City = request.City.Trim();
        stall.State = request.State.Trim();
        stall.Pincode = request.Pincode.Trim();

        _uow.TeaStalls.Update(stall);
        await _uow.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpPut("tea-stalls/{id:guid}/status")]
    public async Task<IActionResult> UpdateTeaStallStatus(Guid id, [FromBody] UpdateTeaStallStatusRequest request, CancellationToken ct)
    {
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        stall.IsActive = request.IsActive;
        _uow.TeaStalls.Update(stall);
        await _uow.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpGet("users")]
    public async Task<IActionResult> Users(CancellationToken ct)
    {
        var data = await _uow.Users.Query()
            .GroupJoin(_uow.Designations.Query(), u => u.DesignationId, d => d.Id, (u, ds) => new { u, ds })
            .SelectMany(x => x.ds.DefaultIfEmpty(), (x, d) => new
            {
                x.u.Id,
                x.u.Name,
                x.u.Phone,
                Role = x.u.Role.ToString(),
                x.u.IsActive,
                x.u.CreatedAt,
                Designation = d != null ? d.Name : null
            })
            .ToListAsync(ct);

        return Ok(data);
    }

    [HttpGet("designations")]
    public async Task<IActionResult> Designations(CancellationToken ct)
    {
        var data = await _uow.Designations.Query()
            .OrderBy(x => x.Name)
            .Select(x => new { x.Id, x.Name, x.IsActive, x.CreatedAt })
            .ToListAsync(ct);

        return Ok(data);
    }

    [HttpPost("designations")]
    public async Task<IActionResult> CreateDesignation([FromBody] CreateDesignationRequest request, CancellationToken ct)
    {
        var existing = await _uow.Designations.Query().AnyAsync(x => x.Name == request.Name, ct);
        if (existing)
        {
            return Ok();
        }

        await _uow.Designations.AddAsync(new BillTraceStall.Domain.Entities.Designation { Name = request.Name, IsActive = true }, ct);
        await _uow.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpPut("designations/{id:guid}/status")]
    public async Task<IActionResult> UpdateDesignationStatus(Guid id, [FromBody] UpdateDesignationStatusRequest request, CancellationToken ct)
    {
        var des = await _uow.Designations.Query().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (des is null)
        {
            throw new AppException("Designation not found.", 404);
        }

        des.IsActive = request.IsActive;
        _uow.Designations.Update(des);
        await _uow.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpGet("employees")]
    public async Task<IActionResult> Employees(CancellationToken ct)
    {
        var data = await _uow.Users.Query()
            .Where(x => x.Role == UserRole.Admin)
            .GroupJoin(_uow.Designations.Query(), u => u.DesignationId, d => d.Id, (u, ds) => new { u, ds })
            .SelectMany(x => x.ds.DefaultIfEmpty(), (x, d) => new
            {
                x.u.Id,
                x.u.Name,
                x.u.Phone,
                x.u.IsActive,
                x.u.CreatedAt,
                Designation = d != null ? d.Name : null
            })
            .OrderBy(x => x.Name)
            .ToListAsync(ct);

        return Ok(data);
    }

    [HttpPost("employees")]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest request, CancellationToken ct)
    {
        var phone = (request.Phone ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(request.Name)
            || string.IsNullOrWhiteSpace(phone)
            || string.IsNullOrWhiteSpace(request.Password)
            || string.IsNullOrWhiteSpace(request.DesignationName))
        {
            throw new AppException("Name, phone, password and designation are required.", 400);
        }

        var exists = await _uow.Users.Query().AnyAsync(x => x.Phone == phone, ct);
        if (exists)
        {
            throw new AppException("User already exists.", 409);
        }

        var designation = await _uow.Designations.Query()
            .FirstOrDefaultAsync(x => x.Name == request.DesignationName.Trim() && x.IsActive, ct);
        if (designation is null)
        {
            throw new AppException("Invalid designation.", 400);
        }

        await _uow.Users.AddAsync(new BillTraceStall.Domain.Entities.User
        {
            Name = request.Name.Trim(),
            Phone = phone,
            Role = UserRole.Admin,
            Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim(),
            DesignationId = designation.Id,
            PasswordHash = _passwordHasher.Hash(request.Password),
            IsActive = true
        }, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok();
    }

    public sealed record CreateDesignationRequest(string Name);
    public sealed record UpdateDesignationStatusRequest(bool IsActive);
    public sealed record CreateEmployeeRequest(string Name, string Phone, string Password, string? Address, string? DesignationName);
    public sealed record UpdateTeaStallRequest(string StallName, string Address, string City, string State, string Pincode);
    public sealed record UpdateTeaStallStatusRequest(bool IsActive);

    [HttpGet("payments")]
    public async Task<IActionResult> Payments(CancellationToken ct)
    {
        var data = await _uow.Payments.Query()
            .Select(x => new { x.Id, x.BillId, x.Amount, Status = x.PaymentStatus.ToString(), x.PaymentGateway, x.CreatedAt, x.PaidAt })
            .ToListAsync(ct);

        return Ok(data);
    }
}
