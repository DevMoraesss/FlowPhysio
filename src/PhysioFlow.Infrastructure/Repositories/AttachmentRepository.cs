using Microsoft.EntityFrameworkCore;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Infrastructure.Data;

namespace PhysioFlow.Infrastructure.Repositories;

public class AttachmentRepository : IAttachmentRepository
{
    private readonly PhysioFlowDbContext _context;

    public AttachmentRepository(PhysioFlowDbContext context)
    {
        _context = context;
    }

    public async Task<Attachment?> GetByIdAsync(Guid id)
        => await _context.Attachments.FindAsync(id);

    public async Task<IEnumerable<Attachment>> GetAllByPatientAsync(Guid patientId)
        => await _context.Attachments
            .Where(a => a.PatientId == patientId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

    public async Task AddAsync(Attachment attachment)
    {
        await _context.Attachments.AddAsync(attachment);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var attachment = await _context.Attachments.FindAsync(id);
        if (attachment != null)
        {
            _context.Attachments.Remove(attachment);
            await _context.SaveChangesAsync();
        }
    }
}
