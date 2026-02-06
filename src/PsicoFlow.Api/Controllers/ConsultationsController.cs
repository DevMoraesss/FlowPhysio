using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsicoFlow.Api.DTOs;
using PsicoFlow.Domain.Entities;
using PsicoFlow.Domain.Enums;
using PsicoFlow.Domain.Interfaces;

namespace PsicoFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConsultationsController : ControllerBase
{
    private readonly IConsultationRepository _consultationRepository;
    private readonly IPatientRepository _patientRepository;

    public ConsultationsController(
        IConsultationRepository consultationRepository,
        IPatientRepository patientRepository)
    {
        _consultationRepository = consultationRepository;
        _patientRepository = patientRepository;
    }

    /// <summary>
    /// Get all consultations for current psychologist
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ConsultationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ConsultationResponse>>> GetAll(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] ConsultationStatus? status = null)
    {
        var psicologoId = GetCurrentUserId();
        
        IEnumerable<Consultation> consultations;
        
        if (startDate.HasValue && endDate.HasValue)
        {
            consultations = await _consultationRepository.GetByDateRangeAsync(
                psicologoId, startDate.Value, endDate.Value);
        }
        else if (status.HasValue)
        {
            consultations = await _consultationRepository.GetByStatusAsync(psicologoId, status.Value);
        }
        else
        {
            consultations = await _consultationRepository.GetByPsicologoIdAsync(psicologoId);
        }

        return Ok(consultations.Select(MapToResponse));
    }

    /// <summary>
    /// Get consultation by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ConsultationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ConsultationResponse>> GetById(Guid id)
    {
        var consultation = await _consultationRepository.GetByIdAsync(id);
        if (consultation == null)
            return NotFound();

        var currentUserId = GetCurrentUserId();
        if (consultation.PsicologoId != currentUserId)
            return Forbid();

        return Ok(MapToResponse(consultation));
    }

    /// <summary>
    /// Create new consultation
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ConsultationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ConsultationResponse>> Create([FromBody] CreateConsultationRequest request)
    {
        var currentUserId = GetCurrentUserId();
        
        // Validate patient belongs to current psychologist
        var patient = await _patientRepository.GetByIdAsync(request.PatientId);
        if (patient == null || patient.PsicologoId != currentUserId)
        {
            return BadRequest(new { message = "Paciente não encontrado ou não pertence a você" });
        }

        var consultation = new Consultation
        {
            PatientId = request.PatientId,
            PsicologoId = currentUserId,
            SpecialityId = request.SpecialityId,
            StartAt = request.StartAt,
            EndAt = request.EndAt,
            Type = request.Type,
            Location = request.Location,
            Observation = request.Observation,
            Status = ConsultationStatus.Agendada
        };

        await _consultationRepository.AddAsync(consultation);
        
        // Reload with includes
        consultation = await _consultationRepository.GetByIdAsync(consultation.Id);
        
        return CreatedAtAction(nameof(GetById), new { id = consultation!.Id }, MapToResponse(consultation));
    }

    /// <summary>
    /// Update consultation
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ConsultationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ConsultationResponse>> Update(Guid id, [FromBody] UpdateConsultationRequest request)
    {
        var consultation = await _consultationRepository.GetByIdAsync(id);
        if (consultation == null)
            return NotFound();

        var currentUserId = GetCurrentUserId();
        if (consultation.PsicologoId != currentUserId)
            return Forbid();

        if (request.PatientId.HasValue) consultation.PatientId = request.PatientId.Value;
        if (request.SpecialityId.HasValue) consultation.SpecialityId = request.SpecialityId;
        if (request.StartAt.HasValue) consultation.StartAt = request.StartAt.Value;
        if (request.EndAt.HasValue) consultation.EndAt = request.EndAt.Value;
        if (request.Type.HasValue) consultation.Type = request.Type.Value;
        if (request.Location != null) consultation.Location = request.Location;
        if (request.Observation != null) consultation.Observation = request.Observation;

        await _consultationRepository.UpdateAsync(consultation);
        return Ok(MapToResponse(consultation));
    }

    /// <summary>
    /// Update consultation status
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(ConsultationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ConsultationResponse>> UpdateStatus(
        Guid id, 
        [FromBody] UpdateConsultationStatusRequest request)
    {
        var consultation = await _consultationRepository.GetByIdAsync(id);
        if (consultation == null)
            return NotFound();

        var currentUserId = GetCurrentUserId();
        if (consultation.PsicologoId != currentUserId)
            return Forbid();

        consultation.Status = request.Status;
        await _consultationRepository.UpdateAsync(consultation);
        
        return Ok(MapToResponse(consultation));
    }

    /// <summary>
    /// Delete consultation
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id)
    {
        var consultation = await _consultationRepository.GetByIdAsync(id);
        if (consultation == null)
            return NotFound();

        var currentUserId = GetCurrentUserId();
        if (consultation.PsicologoId != currentUserId)
            return Forbid();

        await _consultationRepository.DeleteAsync(id);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }

    private static ConsultationResponse MapToResponse(Consultation c)
    {
        return new ConsultationResponse
        {
            Id = c.Id,
            PatientId = c.PatientId,
            PatientName = c.Patient?.Name ?? "",
            PsicologoId = c.PsicologoId,
            PsicologoName = c.Psicologo?.Name ?? "",
            SpecialityId = c.SpecialityId,
            SpecialityName = c.Speciality?.Name,
            StartAt = c.StartAt,
            EndAt = c.EndAt,
            Status = c.Status,
            Type = c.Type,
            Location = c.Location,
            Observation = c.Observation,
            CreatedAt = c.CreatedAt
        };
    }
}
