using PsicoFlow.Domain.Entities;

namespace PsicoFlow.Domain.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByResetTokenAsync(string token);
    Task<IEnumerable<User>> GetByRoleAsync(Enums.Role role);
}
