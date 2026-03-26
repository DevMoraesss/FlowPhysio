using PhysioFlow.Domain.Entities;

namespace PhysioFlow.Domain.Interfaces;

public interface IProtocolRepository : IRepository<Protocol>
{
    Task<IEnumerable<Protocol>> GetAllByPatientAsync(Guid patientId);
    Task<IEnumerable<Protocol>> GetActiveByPatientAsync(Guid patientId);
}
