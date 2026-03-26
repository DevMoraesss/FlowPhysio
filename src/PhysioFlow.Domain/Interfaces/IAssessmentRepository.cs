using PhysioFlow.Domain.Entities;

namespace PhysioFlow.Domain.Interfaces;

public interface IAssessmentRepository : IRepository<Assessment>
{
    Task<IEnumerable<Assessment>> GetAllByPatientAsync(Guid patientId);
}
