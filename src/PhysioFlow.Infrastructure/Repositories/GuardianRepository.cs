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
}
