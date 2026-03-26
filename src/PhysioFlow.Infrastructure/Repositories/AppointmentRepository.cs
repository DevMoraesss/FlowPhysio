using Microsoft.EntityFrameworkCore;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Enums;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Infrastructure.Data;

namespace PhysioFlow.Infrastructure.Repositories;

public class AppointmentRepository : Repository<Appointment>, IAppointmentRepository
{
    public AppointmentRepository(PhysioFlowDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Appointment>> GetAllByPatientAsync(Guid patientId)
    {
        return await _dbSet
            .Where(a => a.PatientId == patientId)
            .OrderByDescending(a => a.StartDateTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetAllByPhysioAsync(Guid physioId)
    {
        return await _dbSet
            .Where(a => a.PhysioId == physioId)
            .OrderByDescending(a => a.StartDateTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetByDateRangeAsync(Guid physioId, DateTime start, DateTime end)
    {
        return await _dbSet
            .Where(a => a.PhysioId == physioId
                && a.StartDateTime >= start
                && a.StartDateTime <= end)
            .OrderBy(a => a.StartDateTime)
            .ToListAsync();
    }

    public async Task<Appointment?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(a => a.Patient)
            .Include(a => a.Protocol)
            .Include(a => a.Evolution)
            .FirstOrDefaultAsync(a => a.Id == id);
    }
}
