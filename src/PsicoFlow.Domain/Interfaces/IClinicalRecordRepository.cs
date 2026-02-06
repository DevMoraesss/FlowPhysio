using PsicoFlow.Domain.Entities;

namespace PsicoFlow.Domain.Interfaces;

public interface IClinicalRecordRepository : IRepository<ClinicalRecord>
{
    Task<IEnumerable<ClinicalRecord>> GetByPatientIdAsync(Guid patientId);
    Task<ClinicalRecord?> GetByConsultationIdAsync(Guid consultationId);
}
