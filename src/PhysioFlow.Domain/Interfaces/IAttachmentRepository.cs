using PhysioFlow.Domain.Entities;

namespace PhysioFlow.Domain.Interfaces;

public interface IAttachmentRepository
{
    Task<Attachment?> GetByIdAsync(Guid id);
    Task<IEnumerable<Attachment>> GetAllByPatientAsync(Guid patientId);
    Task AddAsync(Attachment attachment);
    Task DeleteAsync(Guid id);
}
