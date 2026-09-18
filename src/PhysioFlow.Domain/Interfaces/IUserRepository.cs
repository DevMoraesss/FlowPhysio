using PhysioFlow.Domain.Entities;

namespace PhysioFlow.Domain.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);

    /// <summary>Busca por CPF já normalizado (só dígitos). Usado para impedir duplicidade.</summary>
    Task<User?> GetByCpfAsync(string cpf);
}
