using PhysioFlow.Domain.Entities;

namespace PhysioFlow.Domain.Interfaces;

public interface IGuardianRepository : IRepository<Guardian>
{
    Task<Guardian?> GetByIdWithPatientsAsync(Guid id);
    Task<IEnumerable<Guardian>> GetAllByPhysioAsync(Guid physioId);
    Task<bool> BelongsToPhysioAsync(Guid guardianId, Guid physioId);

    /// <summary>Busca por CPF já normalizado (só dígitos). Usado para impedir duplicidade.</summary>
    Task<Guardian?> GetByCpfAsync(string cpf);
}
