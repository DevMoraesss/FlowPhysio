using Microsoft.EntityFrameworkCore;
using PsicoFlow.Domain.Entities;
using PsicoFlow.Domain.Interfaces;
using PsicoFlow.Infrastructure.Data;

namespace PsicoFlow.Infrastructure.Repositories;

public class PatientRepository : Repository<Patient>, IPatientRepository
{
    public PatientRepository(PsicoFlowDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Patient>> GetByPsicologoIdAsync(Guid psicologoId)
    {
        return await _dbSet
            .Where(p => p.PsicologoId == psicologoId)
            .Include(p => p.Responsible)
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<Patient>> SearchByNameAsync(string name, Guid psicologoId)
    {
        return await _dbSet
            .Where(p => p.PsicologoId == psicologoId && 
                       p.Name.ToLower().Contains(name.ToLower()))
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    public override async Task<Patient?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(p => p.Responsible)
            .Include(p => p.Psicologo)
            .FirstOrDefaultAsync(p => p.Id == id);
    }
}
