using PhysioFlow.Domain.Entities;

namespace PhysioFlow.Domain.Interfaces;

public interface IAppointmentRepository : IRepository<Appointment>
{
    Task<IEnumerable<Appointment>> GetAllByPatientAsync(Guid patientId);
    Task<IEnumerable<Appointment>> GetAllByPhysioAsync(Guid physioId);
    Task<IEnumerable<Appointment>> GetByDateRangeAsync(Guid physioId, DateTime start, DateTime end);
    Task<Appointment?> GetByIdWithDetailsAsync(Guid id);
    Task<IEnumerable<Appointment>> GetNoShowsWithoutReschedulingAsync(Guid physioId);
    Task<IEnumerable<Appointment>> GetPendingPaymentsAsync(Guid physioId);
    Task<IEnumerable<Appointment>> GetByIdsAsync(List<Guid> ids);
}
