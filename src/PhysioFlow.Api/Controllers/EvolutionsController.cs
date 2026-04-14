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
public class EvolutionsController : ControllerBase
{
    private readonly IEvolutionRepository _evolutionRepository;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IPatientRepository _patientRepository;

    public EvolutionsController(
        IEvolutionRepository evolutionRepository,
        IAppointmentRepository appointmentRepository,
        IPatientRepository patientRepository)
    {
        _evolutionRepository = evolutionRepository;
        _appointmentRepository = appointmentRepository;
        _patientRepository = patientRepository;
    }

    [HttpGet("patient/{patientId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<EvolutionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<EvolutionResponse>>> GetByPatient(Guid patientId)
    {
        if (!await IsOwnedByCurrentUser(patientId))
            return NotFound();

        var evolutions = await _evolutionRepository.GetAllByPatientAsync(patientId);
        return Ok(evolutions.Select(MapToResponse));
    }

    [HttpGet("appointment/{appointmentId:guid}")]
    [ProducesResponseType(typeof(EvolutionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EvolutionResponse>> GetByAppointment(Guid appointmentId)
    {
        var evolution = await _evolutionRepository.GetByAppointmentAsync(appointmentId);
        if (evolution == null)
            return NotFound();

        if (!await IsOwnedByCurrentUser(evolution.PatientId))
            return NotFound();

        return Ok(MapToResponse(evolution));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(EvolutionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EvolutionResponse>> GetById(Guid id)
    {
        var evolution = await _evolutionRepository.GetByIdAsync(id);
        if (evolution == null)
            return NotFound();

        if (!await IsOwnedByCurrentUser(evolution.PatientId))
            return NotFound();

        return Ok(MapToResponse(evolution));
    }

    [HttpPost]
    [ProducesResponseType(typeof(EvolutionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EvolutionResponse>> Create([FromBody] CreateEvolutionRequest request)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(request.AppointmentId);
        if (appointment == null || appointment.PhysioId != GetCurrentUserId())
            return NotFound(new { message = "Agendamento não encontrado" });

        if (appointment.Status != AppointmentStatus.Completed)
            return BadRequest(new { message = "Só é possível registrar evolução para sessões concluídas" });

        var existing = await _evolutionRepository.GetByAppointmentAsync(request.AppointmentId);
        if (existing != null)
            return BadRequest(new { message = "Já existe uma evolução para este agendamento" });

        var evolution = new Evolution
        {
            AppointmentId = request.AppointmentId,
            PatientId = appointment.PatientId,
            ProceduresPerformed = request.ProceduresPerformed,
            TechniquesApplied = request.TechniquesApplied,
            PainScale = request.PainScale,
            ClinicalNotes = request.ClinicalNotes,
            NextSessionPlan = request.NextSessionPlan
        };

        await _evolutionRepository.AddAsync(evolution);
        return CreatedAtAction(nameof(GetById), new { id = evolution.Id }, MapToResponse(evolution));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(EvolutionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EvolutionResponse>> Update(Guid id, [FromBody] UpdateEvolutionRequest request)
    {
        var evolution = await _evolutionRepository.GetByIdAsync(id);
        if (evolution == null)
            return NotFound();

        if (!await IsOwnedByCurrentUser(evolution.PatientId))
            return NotFound();

        if (request.ProceduresPerformed != null) evolution.ProceduresPerformed = request.ProceduresPerformed;
        if (request.TechniquesApplied != null) evolution.TechniquesApplied = request.TechniquesApplied;
        if (request.PainScale.HasValue) evolution.PainScale = request.PainScale.Value;
        if (request.ClinicalNotes != null) evolution.ClinicalNotes = request.ClinicalNotes;
        if (request.NextSessionPlan != null) evolution.NextSessionPlan = request.NextSessionPlan;

        await _evolutionRepository.UpdateAsync(evolution);
        return Ok(MapToResponse(evolution));
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }

    private async Task<bool> IsOwnedByCurrentUser(Guid patientId)
    {
        var patient = await _patientRepository.GetByIdAsync(patientId);
        return patient != null && patient.PhysioId == GetCurrentUserId();
    }

    private static EvolutionResponse MapToResponse(Evolution evolution) => new()
    {
        Id = evolution.Id,
        AppointmentId = evolution.AppointmentId,
        PatientId = evolution.PatientId,
        ProceduresPerformed = evolution.ProceduresPerformed,
        TechniquesApplied = evolution.TechniquesApplied,
        PainScale = evolution.PainScale,
        ClinicalNotes = evolution.ClinicalNotes,
        NextSessionPlan = evolution.NextSessionPlan,
        CreatedAt = evolution.CreatedAt
    };
}
