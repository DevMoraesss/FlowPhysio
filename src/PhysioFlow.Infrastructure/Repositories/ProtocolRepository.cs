using Microsoft.EntityFrameworkCore;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Infrastructure.Data;

namespace PhysioFlow.Infrastructure.Repositories;

public class ProtocolRepository : Repository<Protocol>, IProtocolRepository
{
    public ProtocolRepository(PhysioFlowDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Protocol>> GetAllByPatientAsync(Guid patientId)
    {
        return await _dbSet
            .Where(p => p.PatientId == patientId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Protocol>> GetActiveByPatientAsync(Guid patientId)
    {
        return await _dbSet
            .Where(p => p.PatientId == patientId && p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }
}
