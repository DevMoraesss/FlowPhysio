using PhysioFlow.Domain.Entities;

namespace PhysioFlow.Domain.Interfaces;

public interface IGuardianRepository : IRepository<Guardian>
{
    Task<Guardian?> GetByIdWithPatientsAsync(Guid id);
}
