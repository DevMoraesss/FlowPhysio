using Microsoft.EntityFrameworkCore;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Infrastructure.Data;

namespace PhysioFlow.Infrastructure.Repositories;

public class AssessmentRepository : Repository<Assessment>, IAssessmentRepository
{
    public AssessmentRepository(PhysioFlowDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Assessment>> GetAllByPatientAsync(Guid patientId)
    {
        return await _dbSet
            .Where(a => a.PatientId == patientId)
            .OrderByDescending(a => a.AssessmentDate)
            .ToListAsync();
    }
}
