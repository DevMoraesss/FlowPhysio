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
public class AssessmentsController : ControllerBase
{
    // Intervalo mínimo entre a última avaliação e uma reavaliação trimestral (RF05)
    private const int ReassessmentIntervalDays = 90;

    private readonly IAssessmentRepository _assessmentRepository;
    private readonly IPatientRepository _patientRepository;

    public AssessmentsController(
        IAssessmentRepository assessmentRepository,
        IPatientRepository patientRepository)
    {
        _assessmentRepository = assessmentRepository;
        _patientRepository = patientRepository;
    }

    [HttpGet("patient/{patientId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<AssessmentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<AssessmentResponse>>> GetByPatient(Guid patientId)
    {
        if (!await IsOwnedByCurrentUser(patientId))
            return NotFound();

        var assessments = await _assessmentRepository.GetAllByPatientAsync(patientId);
        return Ok(assessments.Select(MapToResponse));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AssessmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssessmentResponse>> GetById(Guid id)
    {
        var assessment = await _assessmentRepository.GetByIdAsync(id);
        if (assessment == null)
            return NotFound();

        if (!await IsOwnedByCurrentUser(assessment.PatientId))
            return NotFound();

        return Ok(MapToResponse(assessment));
    }

    [HttpPost]
    [ProducesResponseType(typeof(AssessmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssessmentResponse>> Create([FromBody] CreateAssessmentRequest request)
    {
        if (!await IsOwnedByCurrentUser(request.PatientId))
            return NotFound(new { message = "Paciente não encontrado" });

        // Pré-cadastro pode ser agendado, mas não pode receber documento clínico:
        // prontuário é de guarda obrigatória e exige paciente identificado de verdade.
        var patient = await _patientRepository.GetByIdAsync(request.PatientId);
        if (patient is { CanReceiveClinicalRecords: false })
            return BadRequest(new { message = "Complete o cadastro do paciente antes de registrar uma avaliação" });

        var assessmentDateUtc = DateTime.SpecifyKind(request.AssessmentDate, DateTimeKind.Utc);
        var existing = (await _assessmentRepository.GetAllByPatientAsync(request.PatientId)).ToList();

        if (request.Type == AssessmentType.Initial &&
            existing.Any(a => a.Type == AssessmentType.Initial))
        {
            return BadRequest(new { message = "Este paciente já possui uma avaliação inicial. Registre uma reavaliação trimestral." });
        }

        if (request.Type == AssessmentType.QuarterlyReassessment)
        {
            var lastAssessment = existing.OrderByDescending(a => a.AssessmentDate).FirstOrDefault();
            if (lastAssessment == null)
                return BadRequest(new { message = "Ainda não há avaliação inicial registrada. Crie a avaliação inicial primeiro." });

            var daysSinceLast = (assessmentDateUtc.Date - lastAssessment.AssessmentDate.Date).Days;
            if (daysSinceLast < ReassessmentIntervalDays)
            {
                var daysLeft = ReassessmentIntervalDays - daysSinceLast;
                return BadRequest(new { message = $"A última avaliação foi há {daysSinceLast} dia(s). A reavaliação trimestral só pode ser registrada após {ReassessmentIntervalDays} dias (faltam {daysLeft})." });
            }
        }

        var assessment = new Assessment
        {
            PatientId = request.PatientId,
            Type = request.Type,
            AssessmentDate = assessmentDateUtc,
            AnamnesisAnswers = request.AnamnesisAnswers,
            GeneralNotes = request.GeneralNotes
        };

        await _assessmentRepository.AddAsync(assessment);
        return CreatedAtAction(nameof(GetById), new { id = assessment.Id }, MapToResponse(assessment));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id)
    {
        var assessment = await _assessmentRepository.GetByIdAsync(id);
        if (assessment == null) return NotFound();
        if (!await IsOwnedByCurrentUser(assessment.PatientId)) return NotFound();
        await _assessmentRepository.DeleteAsync(id);
        return NoContent();
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(AssessmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssessmentResponse>> Update(Guid id, [FromBody] UpdateAssessmentRequest request)
    {
        var assessment = await _assessmentRepository.GetByIdAsync(id);
        if (assessment == null)
            return NotFound();

        if (!await IsOwnedByCurrentUser(assessment.PatientId))
            return NotFound();

        if (request.AnamnesisAnswers != null) assessment.AnamnesisAnswers = request.AnamnesisAnswers;
        if (request.GeneralNotes != null) assessment.GeneralNotes = request.GeneralNotes;

        await _assessmentRepository.UpdateAsync(assessment);
        return Ok(MapToResponse(assessment));
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

    private static AssessmentResponse MapToResponse(Assessment assessment) => new()
    {
        Id = assessment.Id,
        PatientId = assessment.PatientId,
        Type = assessment.Type,
        AssessmentDate = assessment.AssessmentDate,
        AnamnesisAnswers = assessment.AnamnesisAnswers,
        GeneralNotes = assessment.GeneralNotes,
        CreatedAt = assessment.CreatedAt
    };
}
