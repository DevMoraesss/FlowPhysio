using Microsoft.EntityFrameworkCore;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Enums;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Infrastructure.Data;

namespace PhysioFlow.Infrastructure.Repositories;

public class AppointmentRepository : Repository<Appointment>, IAppointmentRepository
{
    public AppointmentRepository(PhysioFlowDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Appointment>> GetAllByPatientAsync(Guid patientId)
    {
        return await _dbSet
            .Where(a => a.PatientId == patientId)
            .OrderByDescending(a => a.StartDateTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetAllByPhysioAsync(Guid physioId)
    {
        return await _dbSet
            .Include(a => a.Patient)   // ← JOIN com Patient
            .Where(a => a.PhysioId == physioId)
            .OrderByDescending(a => a.StartDateTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetByDateRangeAsync(Guid physioId, DateTime start, DateTime end)
    {
        return await _dbSet
            .Include(a => a.Patient)
            .Where(a => a.PhysioId == physioId
                && a.StartDateTime < end       // ← overlap: início antes do fim do novo
                && a.EndDateTime > start)      // ← overlap: fim depois do início do novo
            .OrderBy(a => a.StartDateTime)
            .ToListAsync();
    }



    public async Task<Appointment?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(a => a.Patient)
            .Include(a => a.Protocol)
            .Include(a => a.Evolution)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<IEnumerable<Appointment>> GetNoShowsWithoutReschedulingAsync(Guid physioId)
    {
        var now = DateTime.UtcNow;

        // Busca todos os agendamentos com NoShow desta fisioterapeuta
        var noShows = await _dbSet
            .Include(a => a.Patient)
            .Where(a => a.PhysioId == physioId && a.Status == AppointmentStatus.NoShow)
            .ToListAsync();

        // Para cada NoShow, verifica se o paciente tem algum agendamento futuro Scheduled
        var result = new List<Appointment>();

        foreach (var noShow in noShows)
        {
            var hasFutureAppointment = await _dbSet.AnyAsync(a =>
                a.PatientId == noShow.PatientId &&
                a.Status == AppointmentStatus.Scheduled &&
                a.StartDateTime > now);

            if (!hasFutureAppointment)
                result.Add(noShow);
        }

        // Remove pacientes duplicados (se o mesmo paciente faltou mais de uma vez,
        // mostra apenas o NoShow mais recente)
        return result
            .GroupBy(a => a.PatientId)
            .Select(g => g.OrderByDescending(a => a.StartDateTime).First())
            .ToList();
    }

    public async Task<IEnumerable<Appointment>> GetPendingPaymentsAsync(Guid physioId)
    {
        return await _dbSet
            .Include(a => a.Patient)
            .Where(a => a.PhysioId == physioId
                && a.Status == AppointmentStatus.Completed
                && a.PaymentStatus == PaymentStatus.Pending)
            .OrderBy(a => a.PatientId)
            .ThenBy(a => a.StartDateTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetByIdsAsync(List<Guid> ids)
    {
        return await _dbSet
            .Where(a => ids.Contains(a.Id))
            .ToListAsync();
    }


}
