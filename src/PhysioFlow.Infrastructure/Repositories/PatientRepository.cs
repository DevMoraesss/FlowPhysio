using Microsoft.EntityFrameworkCore;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Infrastructure.Data;

namespace PhysioFlow.Infrastructure.Repositories;

public class PatientRepository : Repository<Patient>, IPatientRepository
{
    public PatientRepository(PhysioFlowDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Patient>> GetAllByPhysioAsync(Guid physioId)
    {
        return await _dbSet
            .Where(p => p.PhysioId == physioId)
            .OrderBy(p => p.FullName)
            .ToListAsync();
    }

    public async Task<Patient?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(p => p.Guardian)
            .FirstOrDefaultAsync(p => p.Id == id);
    }
}
