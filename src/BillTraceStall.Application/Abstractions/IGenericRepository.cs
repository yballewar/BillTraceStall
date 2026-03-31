namespace BillTraceStall.Application.Abstractions;

public interface IGenericRepository<TEntity>
    where TEntity : class
{
    IQueryable<TEntity> Query();
    Task<TEntity?> GetByIdAsync(Guid id, CancellationToken ct);
    Task AddAsync(TEntity entity, CancellationToken ct);
    void Update(TEntity entity);
    void Remove(TEntity entity);
}
