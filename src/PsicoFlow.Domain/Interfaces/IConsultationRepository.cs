using PsicoFlow.Domain.Entities;
using PsicoFlow.Domain.Enums;

namespace PsicoFlow.Domain.Interfaces;

public interface IConsultationRepository : IRepository<Consultation>
{
    Task<IEnumerable<Consultation>> GetByPsicologoIdAsync(Guid psicologoId);
    Task<IEnumerable<Consultation>> GetByPatientIdAsync(Guid patientId);
    Task<IEnumerable<Consultation>> GetByDateRangeAsync(Guid psicologoId, DateTime startDate, DateTime endDate);
    Task<IEnumerable<Consultation>> GetByStatusAsync(Guid psicologoId, ConsultationStatus status);
}
