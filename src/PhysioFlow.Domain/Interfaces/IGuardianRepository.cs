using PhysioFlow.Domain.Entities;

namespace PhysioFlow.Domain.Interfaces;

public interface IGuardianRepository : IRepository<Guardian>
{
    Task<Guardian?> GetByIdWithPatientsAsync(Guid id);
    Task<IEnumerable<Guardian>> GetAllByPhysioAsync(Guid physioId);
    Task<bool> BelongsToPhysioAsync(Guid guardianId, Guid physioId);
}
