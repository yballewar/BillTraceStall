using BillTraceStall.Application.Abstractions;
using BillTraceStall.Application.DTOs.Delivery;
using BillTraceStall.Application.DTOs.Menu;
using BillTraceStall.Application.DTOs.TeaStalls;
using BillTraceStall.Application.Exceptions;
using BillTraceStall.Domain.Entities;
using BillTraceStall.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.Infrastructure.Services;

public sealed class TeaStallService : ITeaStallService
{
    private readonly IUnitOfWork _uow;

    public TeaStallService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<Guid> CreateTeaStallAsync(Guid ownerUserId, CreateTeaStallRequest request, CancellationToken ct)
    {
        var owner = await _uow.Users.Query().FirstOrDefaultAsync(x => x.Id == ownerUserId, ct);
        if (owner is null || owner.Role != UserRole.TeaStallOwner)
        {
            throw new AppException("Invalid owner.", 403);
        }

        var exists = await _uow.TeaStalls.Query().AnyAsync(x => x.OwnerId == ownerUserId, ct);
        if (exists)
        {
            throw new AppException("Tea stall already exists for this owner.", 409);
        }

        var uniqueCode = $"TS{Random.Shared.Next(100000, 999999)}";

        var stall = new TeaStall
        {
            OwnerId = ownerUserId,
            StallName = request.StallName,
            Address = request.Address,
            City = request.City,
            State = request.State,
            Pincode = request.Pincode,
            UniqueCode = uniqueCode,
            IsApproved = false
        };

        await _uow.TeaStalls.AddAsync(stall, ct);
        await _uow.SaveChangesAsync(ct);
        return stall.Id;
    }

    public async Task UpsertMenuItemsAsync(Guid ownerUserId, List<UpsertMenuItemRequest> items, CancellationToken ct)
    {
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.OwnerId == ownerUserId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        foreach (var item in items)
        {
            if (item.Id is null || item.Id == Guid.Empty)
            {
                await _uow.MenuItems.AddAsync(new MenuItem
                {
                    StallId = stall.Id,
                    ItemName = item.ItemName,
                    Price = item.Price,
                    Category = item.Category,
                    IsActive = item.IsActive
                }, ct);
            }
            else
            {
                var existing = await _uow.MenuItems.Query().FirstOrDefaultAsync(x => x.Id == item.Id && x.StallId == stall.Id, ct);
                if (existing is null)
                {
                    throw new AppException("Menu item not found.", 404);
                }

                existing.ItemName = item.ItemName;
                existing.Price = item.Price;
                existing.Category = item.Category;
                existing.IsActive = item.IsActive;
                _uow.MenuItems.Update(existing);
            }
        }

        await _uow.SaveChangesAsync(ct);
    }

    public async Task<Guid> AddDeliveryBoyAsync(Guid ownerUserId, CreateDeliveryBoyRequest request, CancellationToken ct)
    {
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.OwnerId == ownerUserId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        var userExists = await _uow.Users.Query().AnyAsync(x => x.Phone == request.Phone, ct);
        if (userExists)
        {
            throw new AppException("Phone already registered.", 409);
        }

        var user = new User
        {
            Name = request.Name,
            Phone = request.Phone,
            Role = UserRole.DeliveryBoy,
            IsActive = true
        };

        await _uow.Users.AddAsync(user, ct);
        await _uow.SaveChangesAsync(ct);

        var deliveryBoy = new DeliveryBoy
        {
            StallId = stall.Id,
            DeliveryUserId = user.Id,
            Name = request.Name,
            Phone = request.Phone
        };

        await _uow.DeliveryBoys.AddAsync(deliveryBoy, ct);
        await _uow.SaveChangesAsync(ct);
        return deliveryBoy.Id;
    }

    public async Task UpdateDeliveryBoyAsync(Guid ownerUserId, Guid deliveryBoyId, UpdateDeliveryBoyRequest request, CancellationToken ct)
    {
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.OwnerId == ownerUserId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        var deliveryBoy = await _uow.DeliveryBoys.Query()
            .FirstOrDefaultAsync(x => x.Id == deliveryBoyId && x.StallId == stall.Id, ct);
        if (deliveryBoy is null)
        {
            throw new AppException("Delivery boy not found.", 404);
        }

        var user = await _uow.Users.Query().FirstOrDefaultAsync(x => x.Id == deliveryBoy.DeliveryUserId, ct);
        if (user is null)
        {
            throw new AppException("User not found.", 404);
        }

        var phoneInUse = await _uow.Users.Query()
            .AnyAsync(x => x.Phone == request.Phone && x.Id != user.Id, ct);
        if (phoneInUse)
        {
            throw new AppException("Phone already registered.", 409);
        }

        user.Name = request.Name;
        user.Phone = request.Phone;
        _uow.Users.Update(user);

        deliveryBoy.Name = request.Name;
        deliveryBoy.Phone = request.Phone;
        _uow.DeliveryBoys.Update(deliveryBoy);

        await _uow.SaveChangesAsync(ct);
    }

    public async Task AssignDeliveryBoyToOfficeAsync(Guid ownerUserId, Guid officeId, Guid deliveryBoyId, CancellationToken ct)
    {
        var stall = await _uow.TeaStalls.Query().FirstOrDefaultAsync(x => x.OwnerId == ownerUserId, ct);
        if (stall is null)
        {
            throw new AppException("Tea stall not found.", 404);
        }

        var office = await _uow.Offices.Query().FirstOrDefaultAsync(x => x.Id == officeId && x.StallId == stall.Id, ct);
        var delivery = await _uow.DeliveryBoys.Query().FirstOrDefaultAsync(x => x.Id == deliveryBoyId && x.StallId == stall.Id, ct);

        if (office is null || delivery is null)
        {
            throw new AppException("Office or delivery boy not found.", 404);
        }

        await Task.CompletedTask;
    }
}
