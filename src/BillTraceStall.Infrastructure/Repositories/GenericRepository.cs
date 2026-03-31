using BillTraceStall.Application.Abstractions;
using BillTraceStall.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BillTraceStall.Infrastructure.Repositories;

public sealed class GenericRepository<TEntity> : IGenericRepository<TEntity>
    where TEntity : class
{
    private readonly DbContext _dbContext;
    private readonly DbSet<TEntity> _set;

    public GenericRepository(DbContext dbContext)
    {
        _dbContext = dbContext;
        _set = dbContext.Set<TEntity>();
    }

    public IQueryable<TEntity> Query() => _set.AsQueryable();

    public Task<TEntity?> GetByIdAsync(Guid id, CancellationToken ct) => _set.FindAsync([id], ct).AsTask();

    public Task AddAsync(TEntity entity, CancellationToken ct)
    {
        if (entity is EntityBase eb)
        {
            if (eb.Id == Guid.Empty)
            {
                eb.Id = Guid.NewGuid();
            }

            if (eb.CreatedAt == default)
            {
                eb.CreatedAt = DateTimeOffset.UtcNow;
            }
        }

        return _set.AddAsync(entity, ct).AsTask();
    }

    public void Update(TEntity entity) => _set.Update(entity);

    public void Remove(TEntity entity) => _set.Remove(entity);
}
