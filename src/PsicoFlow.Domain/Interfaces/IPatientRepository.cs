using PsicoFlow.Domain.Entities;

namespace PsicoFlow.Domain.Interfaces;

public interface IPatientRepository : IRepository<Patient>
{
    Task<IEnumerable<Patient>> GetByPsicologoIdAsync(Guid psicologoId);
    Task<IEnumerable<Patient>> SearchByNameAsync(string name, Guid psicologoId);
}
