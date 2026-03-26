using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Enums;

namespace PhysioFlow.Domain.Interfaces;

public interface IAppointmentRepository : IRepository<Appointment>
{
    Task<IEnumerable<Appointment>> GetAllByPatientAsync(Guid patientId);
    Task<IEnumerable<Appointment>> GetAllByPhysioAsync(Guid physioId);
    Task<IEnumerable<Appointment>> GetByDateRangeAsync(Guid physioId, DateTime start, DateTime end);
    Task<Appointment?> GetByIdWithDetailsAsync(Guid id);
}
