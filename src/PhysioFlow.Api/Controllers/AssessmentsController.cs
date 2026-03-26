using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;

namespace PhysioFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssessmentsController : ControllerBase
{
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
    public async Task<ActionResult<IEnumerable<AssessmentResponse>>> GetByPatient(Guid patientId)
    {
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

        return Ok(MapToResponse(assessment));
    }

    [HttpPost]
    [ProducesResponseType(typeof(AssessmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssessmentResponse>> Create([FromBody] CreateAssessmentRequest request)
    {
        var patient = await _patientRepository.GetByIdAsync(request.PatientId);
        if (patient == null)
            return NotFound(new { message = "Paciente não encontrado" });

        var assessment = new Assessment
        {
            PatientId = request.PatientId,
            Type = request.Type,
            AssessmentDate = DateTime.SpecifyKind(request.AssessmentDate, DateTimeKind.Utc),
            AnamnesisAnswers = request.AnamnesisAnswers,
            GeneralNotes = request.GeneralNotes
        };

        await _assessmentRepository.AddAsync(assessment);
        return CreatedAtAction(nameof(GetById), new { id = assessment.Id }, MapToResponse(assessment));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(AssessmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssessmentResponse>> Update(Guid id, [FromBody] UpdateAssessmentRequest request)
    {
        var assessment = await _assessmentRepository.GetByIdAsync(id);
        if (assessment == null)
            return NotFound();

        if (request.AnamnesisAnswers != null) assessment.AnamnesisAnswers = request.AnamnesisAnswers;
        if (request.GeneralNotes != null) assessment.GeneralNotes = request.GeneralNotes;

        await _assessmentRepository.UpdateAsync(assessment);
        return Ok(MapToResponse(assessment));
    }

    private static AssessmentResponse MapToResponse(Assessment assessment)
    {
        return new AssessmentResponse
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
}
