using PhysioFlow.Domain.Entities;

namespace PhysioFlow.Domain.Interfaces;

public interface IEvolutionRepository : IRepository<Evolution>
{
    Task<IEnumerable<Evolution>> GetAllByPatientAsync(Guid patientId);
    Task<Evolution?> GetByAppointmentAsync(Guid appointmentId);
}
