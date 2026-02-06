using Microsoft.EntityFrameworkCore;
using PsicoFlow.Domain.Entities;
using PsicoFlow.Domain.Enums;
using PsicoFlow.Domain.Interfaces;
using PsicoFlow.Infrastructure.Data;

namespace PsicoFlow.Infrastructure.Repositories;

public class ConsultationRepository : Repository<Consultation>, IConsultationRepository
{
    public ConsultationRepository(PsicoFlowDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Consultation>> GetByPsicologoIdAsync(Guid psicologoId)
    {
        return await _dbSet
            .Where(c => c.PsicologoId == psicologoId)
            .Include(c => c.Patient)
            .Include(c => c.Speciality)
            .OrderByDescending(c => c.StartAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Consultation>> GetByPatientIdAsync(Guid patientId)
    {
        return await _dbSet
            .Where(c => c.PatientId == patientId)
            .Include(c => c.Psicologo)
            .Include(c => c.Speciality)
            .OrderByDescending(c => c.StartAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Consultation>> GetByDateRangeAsync(Guid psicologoId, DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Where(c => c.PsicologoId == psicologoId && 
                       c.StartAt >= startDate && 
                       c.StartAt <= endDate)
            .Include(c => c.Patient)
            .Include(c => c.Speciality)
            .OrderBy(c => c.StartAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Consultation>> GetByStatusAsync(Guid psicologoId, ConsultationStatus status)
    {
        return await _dbSet
            .Where(c => c.PsicologoId == psicologoId && c.Status == status)
            .Include(c => c.Patient)
            .OrderByDescending(c => c.StartAt)
            .ToListAsync();
    }

    public override async Task<Consultation?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(c => c.Patient)
            .Include(c => c.Psicologo)
            .Include(c => c.Speciality)
            .Include(c => c.ClinicalRecord)
            .FirstOrDefaultAsync(c => c.Id == id);
    }
}
