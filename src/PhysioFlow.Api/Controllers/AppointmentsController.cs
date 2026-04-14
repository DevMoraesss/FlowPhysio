using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Enums;
using PhysioFlow.Domain.Interfaces;

namespace PhysioFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IPatientRepository _patientRepository;
    private readonly IProtocolRepository _protocolRepository;

    public AppointmentsController(
        IAppointmentRepository appointmentRepository,
        IPatientRepository patientRepository,
        IProtocolRepository protocolRepository)
    {
        _appointmentRepository = appointmentRepository;
        _patientRepository = patientRepository;
        _protocolRepository = protocolRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppointmentResponse>>> GetAll()
    {
        var physioId = GetCurrentUserId();
        var appointments = await _appointmentRepository.GetAllByPhysioAsync(physioId);
        return Ok(appointments.Select(MapToResponse));
    }

    [HttpGet("patient/{patientId:guid}")]
    public async Task<ActionResult<IEnumerable<AppointmentResponse>>> GetByPatient(Guid patientId)
    {
        var appointments = await _appointmentRepository.GetAllByPatientAsync(patientId);
        return Ok(appointments.Select(MapToResponse));
    }

    [HttpGet("range")]
    public async Task<ActionResult<IEnumerable<AppointmentResponse>>> GetByRange(
        [FromQuery] DateTime start,
        [FromQuery] DateTime end)
    {
        var physioId = GetCurrentUserId();
        var startUtc = DateTime.SpecifyKind(start, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(end, DateTimeKind.Utc);
        var appointments = await _appointmentRepository.GetByDateRangeAsync(physioId, startUtc, endUtc);
        return Ok(appointments.Select(MapToResponse));
    }

    [HttpGet("pending-payments")]
    public async Task<ActionResult<IEnumerable<PendingPaymentResponse>>> GetPendingPayments()
    {
        var physioId = GetCurrentUserId();
        var appointments = await _appointmentRepository.GetPendingPaymentsAsync(physioId);

        var response = appointments
            .GroupBy(a => a.PatientId)
            .Select(g => new PendingPaymentResponse
            {
                PatientId = g.Key,
                PatientName = g.First().Patient?.FullName ?? "—",
                PaymentCycle = (int)(g.First().Patient?.PaymentCycle ?? PhysioFlow.Domain.Enums.PaymentCycle.PerSession),
                PaymentDay = g.First().Patient?.PaymentDay,
                PendingSessions = g.Count(),
                TotalPending = g.Sum(a => a.SessionValue),
                AppointmentIds = g.Select(a => a.Id).ToList(),
            });

        return Ok(response);
    }

    [HttpPatch("batch-pay")]
    public async Task<ActionResult> BatchPay([FromBody] BatchPayRequest request)
    {
        var appointments = (await _appointmentRepository.GetByIdsAsync(request.AppointmentIds)).ToList();

        if (appointments.Count != request.AppointmentIds.Count)
            return NotFound(new { message = "Um ou mais agendamentos não foram encontrados" });

        var currentUserId = GetCurrentUserId();
        if (appointments.Any(a => a.PhysioId != currentUserId))
            return BadRequest(new { message = "Um ou mais agendamentos não pertencem ao usuário autenticado" });

        var notPending = appointments.Where(a => a.PaymentStatus != PhysioFlow.Domain.Enums.PaymentStatus.Pending).ToList();
        if (notPending.Any())
            return BadRequest(new { message = "Todos os agendamentos devem estar com pagamento Pendente" });

        var method = (PhysioFlow.Domain.Enums.PaymentMethod)request.PaymentMethod;

        foreach (var appt in appointments)
        {
            appt.PaymentStatus = PhysioFlow.Domain.Enums.PaymentStatus.Paid;
            appt.PaymentMethod = method;
            await _appointmentRepository.UpdateAsync(appt);
        }

        return NoContent();
    }



    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AppointmentResponse>> GetById(Guid id)
    {
        var physioId = GetCurrentUserId();
        var appointment = await _appointmentRepository.GetByIdWithDetailsAsync(id);
        if (appointment == null || appointment.PhysioId != physioId) return NotFound();

        return Ok(MapToResponse(appointment));
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentResponse>> Create([FromBody] CreateAppointmentRequest request)
    {
        var patient = await _patientRepository.GetByIdAsync(request.PatientId);
        if (patient == null)
            return NotFound(new { message = "Paciente não encontrado" });

        if (!patient.IsActive)
        return BadRequest(new { message = "Não é possível agendar para um paciente inativo" });


        var physioId = GetCurrentUserId();
        var startUtc = DateTime.SpecifyKind(request.StartDateTime, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(request.EndDateTime, DateTimeKind.Utc);

        // Verificar conflito de horário
        var conflicts = await _appointmentRepository.GetByDateRangeAsync(physioId, startUtc, endUtc);
        if (conflicts.Any(a => a.Status != AppointmentStatus.Cancelled))
            return BadRequest(new { message = "Já existe um agendamento neste horário" });

        var appointment = new Appointment
        {
            PatientId = request.PatientId,
            PhysioId = physioId,
            ProtocolId = request.ProtocolId,
            StartDateTime = startUtc,
            EndDateTime = endUtc,
            Status = AppointmentStatus.Scheduled,
            PaymentStatus = PaymentStatus.Pending,
            SessionValue = request.SessionValue,
            RequiresReceipt = request.RequiresReceipt,
            Notes = request.Notes
        };

        await _appointmentRepository.AddAsync(appointment);
        return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, MapToResponse(appointment));
    }


    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AppointmentResponse>> Update(Guid id, [FromBody] UpdateAppointmentRequest request)
    {
        var physioId = GetCurrentUserId();
        var appointment = await _appointmentRepository.GetByIdAsync(id);
        if (appointment == null || appointment.PhysioId != physioId) return NotFound();

        // Regra: ao concluir, exige status de pagamento
        if (request.Status == AppointmentStatus.Completed && appointment.Status != AppointmentStatus.Completed)
        {
            if (request.PaymentStatus == null)
                return BadRequest(new { message = "Informe o status de pagamento ao concluir a sessão" });
        }

        // Validar conflito se o horário estiver sendo alterado
        if (request.StartDateTime.HasValue || request.EndDateTime.HasValue)
        {
            var newStart = request.StartDateTime.HasValue
                ? DateTime.SpecifyKind(request.StartDateTime.Value, DateTimeKind.Utc)
                : appointment.StartDateTime;
            var newEnd = request.EndDateTime.HasValue
                ? DateTime.SpecifyKind(request.EndDateTime.Value, DateTimeKind.Utc)
                : appointment.EndDateTime;

            var conflicts = await _appointmentRepository.GetByDateRangeAsync(physioId, newStart, newEnd);
            if (conflicts.Any(a => a.Id != id && a.Status != AppointmentStatus.Cancelled))
                return BadRequest(new { message = "Já existe um agendamento neste horário" });
        }


        // Guarda o status anterior para detectar transição
        var previousStatus = appointment.Status;

        if (request.StartDateTime.HasValue)
            appointment.StartDateTime = DateTime.SpecifyKind(request.StartDateTime.Value, DateTimeKind.Utc);
        if (request.EndDateTime.HasValue)
            appointment.EndDateTime = DateTime.SpecifyKind(request.EndDateTime.Value, DateTimeKind.Utc);
        if (request.Status.HasValue) appointment.Status = request.Status.Value;
        if (request.PaymentStatus.HasValue) appointment.PaymentStatus = request.PaymentStatus.Value;
        if (request.PaymentMethod.HasValue) appointment.PaymentMethod = request.PaymentMethod.Value;
        if (request.SessionValue.HasValue) appointment.SessionValue = request.SessionValue.Value;
        if (request.RequiresReceipt.HasValue) appointment.RequiresReceipt = request.RequiresReceipt.Value;
        if (request.Notes != null) appointment.Notes = request.Notes;

        await _appointmentRepository.UpdateAsync(appointment);

        // Se ACABOU DE SER marcado como Completed (era outro status antes) e tem protocolo:
        // avança o progresso do protocolo automaticamente
        bool justCompleted = previousStatus != AppointmentStatus.Completed
                             && appointment.Status == AppointmentStatus.Completed;

        if (justCompleted && appointment.ProtocolId.HasValue)
        {
            var protocol = await _protocolRepository.GetByIdAsync(appointment.ProtocolId.Value);
            if (protocol != null && protocol.IsActive)
            {
                protocol.CompletedSessions++;

                if (protocol.CompletedSessions >= protocol.SessionsPerCycle)
                {
                    if (protocol.CurrentCycle >= protocol.TotalCycles)
                    {
                        // Último ciclo concluído → encerra o protocolo
                        protocol.IsActive = false;
                    }
                    else
                    {
                        // Avança para o próximo ciclo
                        protocol.CurrentCycle++;
                        protocol.CompletedSessions = 0;
                    }
                }

                await _protocolRepository.UpdateAsync(protocol);
            }
        }

        return Ok(MapToResponse(appointment));
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }

    private static AppointmentResponse MapToResponse(Appointment appointment) => new()
    {
        Id = appointment.Id,
        PatientId = appointment.PatientId,
        PhysioId = appointment.PhysioId,
        ProtocolId = appointment.ProtocolId,
        PatientName = appointment.Patient?.FullName,
        PatientPaymentCycle = appointment.Patient?.PaymentCycle,
        StartDateTime = appointment.StartDateTime,
        EndDateTime = appointment.EndDateTime,
        Status = appointment.Status,
        PaymentStatus = appointment.PaymentStatus,
        PaymentMethod = appointment.PaymentMethod,
        SessionValue = appointment.SessionValue,
        RequiresReceipt = appointment.RequiresReceipt,
        Notes = appointment.Notes,
        CreatedAt = appointment.CreatedAt
    };
}
