using Microsoft.EntityFrameworkCore;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Infrastructure.Data;

namespace PhysioFlow.Infrastructure.Repositories;

public class EvolutionRepository : Repository<Evolution>, IEvolutionRepository
{
    public EvolutionRepository(PhysioFlowDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Evolution>> GetAllByPatientAsync(Guid patientId)
    {
        return await _dbSet
            .Where(e => e.PatientId == patientId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<Evolution?> GetByAppointmentAsync(Guid appointmentId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(e => e.AppointmentId == appointmentId);
    }
}
