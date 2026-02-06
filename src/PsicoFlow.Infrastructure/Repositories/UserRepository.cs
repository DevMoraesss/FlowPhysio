using Microsoft.EntityFrameworkCore;
using PsicoFlow.Domain.Entities;
using PsicoFlow.Domain.Enums;
using PsicoFlow.Domain.Interfaces;
using PsicoFlow.Infrastructure.Data;

namespace PsicoFlow.Infrastructure.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(PsicoFlowDbContext context) : base(context)
    {
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
    }

    public async Task<User?> GetByResetTokenAsync(string token)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.PasswordResetToken == token);
    }

    public async Task<IEnumerable<User>> GetByRoleAsync(Role role)
    {
        return await _dbSet.Where(u => u.Role == role).ToListAsync();
    }

    public override async Task<User?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(u => u.Specialities)
            .FirstOrDefaultAsync(u => u.Id == id);
    }
}
