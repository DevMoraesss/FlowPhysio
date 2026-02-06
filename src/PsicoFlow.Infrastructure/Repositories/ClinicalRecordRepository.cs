using Microsoft.EntityFrameworkCore;
using PsicoFlow.Domain.Entities;
using PsicoFlow.Domain.Interfaces;
using PsicoFlow.Infrastructure.Data;

namespace PsicoFlow.Infrastructure.Repositories;

public class ClinicalRecordRepository : Repository<ClinicalRecord>, IClinicalRecordRepository
{
    public ClinicalRecordRepository(PsicoFlowDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ClinicalRecord>> GetByPatientIdAsync(Guid patientId)
    {
        return await _dbSet
            .Where(c => c.PatientId == patientId)
            .Include(c => c.Consultation)
            .Include(c => c.Attachments)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<ClinicalRecord?> GetByConsultationIdAsync(Guid consultationId)
    {
        return await _dbSet
            .Include(c => c.Attachments)
            .FirstOrDefaultAsync(c => c.ConsultationId == consultationId);
    }

    public override async Task<ClinicalRecord?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(c => c.Consultation)
            .Include(c => c.Patient)
            .Include(c => c.Attachments)
            .FirstOrDefaultAsync(c => c.Id == id);
    }
}
