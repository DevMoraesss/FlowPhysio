using PhysioFlow.Domain.Entities;

namespace PhysioFlow.Domain.Interfaces;

public interface IPatientRepository : IRepository<Patient>
{
    Task<IEnumerable<Patient>> GetAllByPhysioAsync(Guid physioId);
    Task<Patient?> GetByIdWithDetailsAsync(Guid id);
}
