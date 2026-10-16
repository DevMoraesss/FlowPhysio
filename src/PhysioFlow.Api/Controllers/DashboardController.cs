using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Domain.Enums;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Domain.Time;

namespace PhysioFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
// Só o perfil Fisioterapeuta. O administrador recebe 403 aqui: ele gerencia contas, não vê pacientes
[Authorize(Roles = nameof(UserRole.Physiotherapist))]
public class DashboardController : ControllerBase
{
    private readonly IAppointmentRepository _appointmentRepository;

    public DashboardController(IAppointmentRepository appointmentRepository)
    {
        _appointmentRepository = appointmentRepository;
    }
    

    [HttpGet]
    [ProducesResponseType(typeof(DashboardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardResponse>> GetToday()
    {
        var physioId = GetCurrentUserId();
        // "Hoje" é o dia de São Paulo, não o de UTC. Antes, depois das 21h o painel já mostrava
        // a agenda do dia seguinte.
        var today = ClinicClock.Today();
        var (startUtc, endUtc) = ClinicClock.DayInUtc(today);

        var appointments = await _appointmentRepository.GetByDateRangeAsync(
            physioId, startUtc, endUtc);

        var list = appointments.ToList();

        var response = new DashboardResponse
        {
            Date = today,
            TotalAppointments = list.Count,
            Completed = list.Count(a => a.Status == AppointmentStatus.Completed),
            Scheduled = list.Count(a => a.Status == AppointmentStatus.Scheduled),
            NoShow = list.Count(a => a.Status == AppointmentStatus.NoShow),
            Cancelled = list.Count(a => a.Status == AppointmentStatus.Cancelled),
            TotalRevenue = list
                .Where(a => a.PaymentStatus == PaymentStatus.Paid)
                .Sum(a => a.SessionValue),
            Appointments = list.Select(a => new AppointmentResponse
            {
                Id = a.Id,
                PatientId = a.PatientId,
                PatientName = a.Patient?.FullName,   // <- linha nova
                PhysioId = a.PhysioId,
                ProtocolId = a.ProtocolId,
                StartDateTime = a.StartDateTime,
                EndDateTime = a.EndDateTime,
                Status = a.Status,
                PaymentStatus = a.PaymentStatus,
                PaymentMethod = a.PaymentMethod,
                SessionValue = a.SessionValue,
                RequiresReceipt = a.RequiresReceipt,
                Notes = a.Notes,
                CreatedAt = a.CreatedAt
            })
        };

        return Ok(response);
    }


    [HttpGet("no-shows")]
    [ProducesResponseType(typeof(IEnumerable<NoShowPatientResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<NoShowPatientResponse>>> GetNoShows()
    {
        var physioId = GetCurrentUserId();
        var noShows = await _appointmentRepository.GetNoShowsWithoutReschedulingAsync(physioId);

        var response = noShows.Select(a => new NoShowPatientResponse
        {
            PatientId = a.PatientId,
            PatientName = a.Patient?.FullName ?? "-",
            LastNoShowDate = a.StartDateTime
        });

        return Ok(response);
    }


        private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }
}

