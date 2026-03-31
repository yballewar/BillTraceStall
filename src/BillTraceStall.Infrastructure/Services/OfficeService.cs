using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.DTOs.Offices;
using BillTraceStall.Application.Exceptions;
using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.Infrastructure.Services;

public sealed class OfficeService : IOfficeService
{
    private readonly IUnitOfWork _uow;

    public OfficeService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<Guid> JoinStallAsync(Guid officeUserId, JoinStallRequest request, CancellationToken ct)
    {
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.UniqueCode == request.StallUniqueCode, ct);
        if (stall is null || !stall.IsApproved || !stall.IsActive)
        {
            throw new AppException("Tea stall not found or not approved.", 404);
        }

        var exists = await _uow.Offices.Query()
            .AnyAsync(x => x.OfficeUserId == officeUserId && x.StallId == stall.Id, ct);
        if (exists)
        {
            throw new AppException("Office already joined this stall.", 409);
        }

        var officeCode = $"OF{Random.Shared.Next(100000, 999999)}";
        var officeUser = await _uow.Users.Query().FirstOrDefaultAsync(x => x.Id == officeUserId, ct);
        if (officeUser is null)
        {
            throw new AppException("User not found.", 404);
        }

        var phone = string.IsNullOrWhiteSpace(request.Phone) ? officeUser.Phone : request.Phone;

        var office = new Office
        {
            StallId = stall.Id,
            OfficeUserId = officeUserId,
            OfficeName = request.OfficeName,
            ContactPerson = request.ContactPerson,
            Phone = phone,
            Address = request.Address,
            UniqueCode = officeCode
        };

        await _uow.Offices.AddAsync(office, ct);
        await _uow.SaveChangesAsync(ct);
        return office.Id;
    }
}
