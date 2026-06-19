using Microsoft.EntityFrameworkCore;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Infrastructure.Data;

namespace PhysioFlow.Infrastructure.Repositories;

public class GuardianRepository : Repository<Guardian>, IGuardianRepository
{
    public GuardianRepository(PhysioFlowDbContext context) : base(context)
    {
    }

    public async Task<Guardian?> GetByIdWithPatientsAsync(Guid id)
    {
        return await _dbSet
            .Include(g => g.Patients)
            .FirstOrDefaultAsync(g => g.Id == id);
    }

    public async Task<IEnumerable<Guardian>> GetAllByPhysioAsync(Guid physioId)
    {
        return await _dbSet
            .Include(g => g.Patients)
            .Where(g => g.Patients.Any(p => p.PhysioId == physioId))
            .ToListAsync();
    }

    public async Task<bool> BelongsToPhysioAsync(Guid guardianId, Guid physioId)
    {
        return await _dbSet
            .Where(g => g.Id == guardianId)
            .AnyAsync(g => g.Patients.Any(p => p.PhysioId == physioId));
    }
}
