using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsicoFlow.Api.DTOs;
using PsicoFlow.Domain.Entities;
using PsicoFlow.Domain.Interfaces;

namespace PsicoFlow.Api.Controllers;

[ApiController]
[Route("api/clinical-records")]
[Authorize]
public class ClinicalRecordsController : ControllerBase
{
    private readonly IClinicalRecordRepository _clinicalRecordRepository;
    private readonly IConsultationRepository _consultationRepository;

    public ClinicalRecordsController(
        IClinicalRecordRepository clinicalRecordRepository,
        IConsultationRepository consultationRepository)
    {
        _clinicalRecordRepository = clinicalRecordRepository;
        _consultationRepository = consultationRepository;
    }

    /// <summary>
    /// Get clinical records by patient
    /// </summary>
    [HttpGet("patient/{patientId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<ClinicalRecordResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ClinicalRecordResponse>>> GetByPatient(Guid patientId)
    {
        var records = await _clinicalRecordRepository.GetByPatientIdAsync(patientId);
        return Ok(records.Select(MapToResponse));
    }

    /// <summary>
    /// Get clinical record by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ClinicalRecordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClinicalRecordResponse>> GetById(Guid id)
    {
        var record = await _clinicalRecordRepository.GetByIdAsync(id);
        if (record == null)
            return NotFound();

        return Ok(MapToResponse(record));
    }

    /// <summary>
    /// Get clinical record by consultation
    /// </summary>
    [HttpGet("consultation/{consultationId:guid}")]
    [ProducesResponseType(typeof(ClinicalRecordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClinicalRecordResponse>> GetByConsultation(Guid consultationId)
    {
        var record = await _clinicalRecordRepository.GetByConsultationIdAsync(consultationId);
        if (record == null)
            return NotFound();

        return Ok(MapToResponse(record));
    }

    /// <summary>
    /// Create clinical record for a consultation
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ClinicalRecordResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ClinicalRecordResponse>> Create([FromBody] CreateClinicalRecordRequest request)
    {
        var currentUserId = GetCurrentUserId();
        
        // Validate consultation exists and belongs to current user
        var consultation = await _consultationRepository.GetByIdAsync(request.ConsultationId);
        if (consultation == null || consultation.PsicologoId != currentUserId)
        {
            return BadRequest(new { message = "Consulta não encontrada ou não pertence a você" });
        }

        // Check if record already exists
        var existingRecord = await _clinicalRecordRepository.GetByConsultationIdAsync(request.ConsultationId);
        if (existingRecord != null)
        {
            return BadRequest(new { message = "Prontuário já existe para esta consulta" });
        }

        var record = new ClinicalRecord
        {
            ConsultationId = request.ConsultationId,
            PatientId = consultation.PatientId,
            Summary = request.Summary,
            TherapeuticGoals = request.TherapeuticGoals,
            Observations = request.Observations
        };

        await _clinicalRecordRepository.AddAsync(record);
        
        record = await _clinicalRecordRepository.GetByIdAsync(record.Id);
        
        return CreatedAtAction(nameof(GetById), new { id = record!.Id }, MapToResponse(record));
    }

    /// <summary>
    /// Update clinical record
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ClinicalRecordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClinicalRecordResponse>> Update(
        Guid id, 
        [FromBody] UpdateClinicalRecordRequest request)
    {
        var record = await _clinicalRecordRepository.GetByIdAsync(id);
        if (record == null)
            return NotFound();

        // Validate ownership through consultation
        var consultation = await _consultationRepository.GetByIdAsync(record.ConsultationId);
        var currentUserId = GetCurrentUserId();
        if (consultation == null || consultation.PsicologoId != currentUserId)
            return Forbid();

        if (request.Summary != null) record.Summary = request.Summary;
        if (request.TherapeuticGoals != null) record.TherapeuticGoals = request.TherapeuticGoals;
        if (request.Observations != null) record.Observations = request.Observations;

        await _clinicalRecordRepository.UpdateAsync(record);
        return Ok(MapToResponse(record));
    }

    /// <summary>
    /// Delete clinical record
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id)
    {
        var record = await _clinicalRecordRepository.GetByIdAsync(id);
        if (record == null)
            return NotFound();

        // Validate ownership
        var consultation = await _consultationRepository.GetByIdAsync(record.ConsultationId);
        var currentUserId = GetCurrentUserId();
        if (consultation == null || consultation.PsicologoId != currentUserId)
            return Forbid();

        await _clinicalRecordRepository.DeleteAsync(id);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }

    private static ClinicalRecordResponse MapToResponse(ClinicalRecord r)
    {
        return new ClinicalRecordResponse
        {
            Id = r.Id,
            ConsultationId = r.ConsultationId,
            PatientId = r.PatientId,
            PatientName = r.Patient?.Name ?? "",
            Summary = r.Summary,
            TherapeuticGoals = r.TherapeuticGoals,
            Observations = r.Observations,
            CreatedAt = r.CreatedAt,
            Attachments = r.Attachments?.Select(a => new AttachmentResponse
            {
                Id = a.Id,
                FileName = a.FileName,
                ContentType = a.ContentType,
                FileSize = a.FileSize,
                CreatedAt = a.CreatedAt
            }).ToList() ?? new List<AttachmentResponse>()
        };
    }
}
