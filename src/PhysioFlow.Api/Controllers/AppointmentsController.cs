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

    public AppointmentsController(
        IAppointmentRepository appointmentRepository,
        IPatientRepository patientRepository)
    {
        _appointmentRepository = appointmentRepository;
        _patientRepository = patientRepository;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AppointmentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AppointmentResponse>>> GetAll()
    {
        var physioId = GetCurrentUserId();
        var appointments = await _appointmentRepository.GetAllByPhysioAsync(physioId);
        return Ok(appointments.Select(MapToResponse));
    }

    [HttpGet("patient/{patientId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<AppointmentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AppointmentResponse>>> GetByPatient(Guid patientId)
    {
        var appointments = await _appointmentRepository.GetAllByPatientAsync(patientId);
        return Ok(appointments.Select(MapToResponse));
    }

    [HttpGet("range")]
    [ProducesResponseType(typeof(IEnumerable<AppointmentResponse>), StatusCodes.Status200OK)]
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

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AppointmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppointmentResponse>> GetById(Guid id)
    {
        var appointment = await _appointmentRepository.GetByIdWithDetailsAsync(id);
        if (appointment == null)
            return NotFound();

        return Ok(MapToResponse(appointment));
    }

    [HttpPost]
    [ProducesResponseType(typeof(AppointmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppointmentResponse>> Create([FromBody] CreateAppointmentRequest request)
    {
        var patient = await _patientRepository.GetByIdAsync(request.PatientId);
        if (patient == null)
            return NotFound(new { message = "Paciente não encontrado" });

        var physioId = GetCurrentUserId();

        var appointment = new Appointment
        {
            PatientId = request.PatientId,
            PhysioId = physioId,
            ProtocolId = request.ProtocolId,
            StartDateTime = DateTime.SpecifyKind(request.StartDateTime, DateTimeKind.Utc),
            EndDateTime = DateTime.SpecifyKind(request.EndDateTime, DateTimeKind.Utc),
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
    [ProducesResponseType(typeof(AppointmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AppointmentResponse>> Update(Guid id, [FromBody] UpdateAppointmentRequest request)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(id);
        if (appointment == null)
            return NotFound();

        if (request.Status == AppointmentStatus.Completed && appointment.Status != AppointmentStatus.Completed)
        {
            if (request.PaymentStatus == null)
                return BadRequest(new { message = "Informe o status de pagamento ao concluir a sessão" });
        }

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
        return Ok(MapToResponse(appointment));
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }

    private static AppointmentResponse MapToResponse(Appointment appointment)
    {
        return new AppointmentResponse
        {
            Id = appointment.Id,
            PatientId = appointment.PatientId,
            PhysioId = appointment.PhysioId,
            ProtocolId = appointment.ProtocolId,
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
}
