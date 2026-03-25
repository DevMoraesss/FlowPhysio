using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsicoFlow.Api.DTOs;
using PsicoFlow.Domain.Entities;
using PsicoFlow.Domain.Interfaces;

namespace PsicoFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly IPatientRepository _patientRepository;

    public PatientsController(IPatientRepository patientRepository)
    {
        _patientRepository = patientRepository;
    }

    /// <summary>
    /// Get all patients for current psychologist
    /// </summary>
    [HttpGet] // httpGet é um atributo que define que o método é um GET
    [ProducesResponseType(typeof(IEnumerable<PatientResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PatientResponse>>> GetAll([FromQuery] string? search = null)
    {
        var psicologoId = GetCurrentUserId();
        
        IEnumerable<Patient> patients;
        if (!string.IsNullOrWhiteSpace(search))
        {
            patients = await _patientRepository.SearchByNameAsync(search, psicologoId);
        }
        else
        {
            patients = await _patientRepository.GetByPsicologoIdAsync(psicologoId);
        }

        return Ok(patients.Select(MapToResponse));
    }

    /// <summary>
    /// Get patient by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PatientResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientResponse>> GetById(Guid id)
    {
        var patient = await _patientRepository.GetByIdAsync(id);
        if (patient == null)
            return NotFound();

        // Only allow access to own patients
        var currentUserId = GetCurrentUserId();
        if (patient.PsicologoId != currentUserId)
            return Forbid();

        return Ok(MapToResponse(patient));
    }

    /// <summary>
    /// Create new patient
    /// </summary>
    [HttpPost] // httpPost é um atributo que define que o método é um POST
    [ProducesResponseType(typeof(PatientResponse), StatusCodes.Status201Created)] //ProducesResponseType é um atributo que define que o método retorna um tipo específico
    public async Task<ActionResult<PatientResponse>> Create([FromBody] CreatePatientRequest request)
    {
        var patient = new Patient
        {
            Name = request.Name,
            BirthDate = request.BirthDate,
            Email = request.Email,
            Phone = request.Phone,
            ResponsibleId = request.ResponsibleId,
            PsicologoId = GetCurrentUserId()
        };

        await _patientRepository.AddAsync(patient);
        
        return CreatedAtAction(nameof(GetById), new { id = patient.Id }, MapToResponse(patient));
    }

    /// <summary>
    /// Update patient
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(PatientResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientResponse>> Update(Guid id, [FromBody] UpdatePatientRequest request)
    {
        var patient = await _patientRepository.GetByIdAsync(id);
        if (patient == null)
            return NotFound();

        var currentUserId = GetCurrentUserId();
        if (patient.PsicologoId != currentUserId)
            return Forbid();

        if (request.Name != null) patient.Name = request.Name;
        if (request.BirthDate != null) patient.BirthDate = request.BirthDate;
        if (request.Email != null) patient.Email = request.Email;
        if (request.Phone != null) patient.Phone = request.Phone;
        if (request.ResponsibleId != null) patient.ResponsibleId = request.ResponsibleId;

        await _patientRepository.UpdateAsync(patient);
        return Ok(MapToResponse(patient));
    }

    /// <summary>
    /// Delete patient
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id)
    {
        var patient = await _patientRepository.GetByIdAsync(id);
        if (patient == null)
            return NotFound();

        var currentUserId = GetCurrentUserId();
        if (patient.PsicologoId != currentUserId)
            return Forbid();

        await _patientRepository.DeleteAsync(id);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }

    private static PatientResponse MapToResponse(Patient patient)
    {
        return new PatientResponse
        {
            Id = patient.Id,
            Name = patient.Name,
            BirthDate = patient.BirthDate,
            Email = patient.Email,
            Phone = patient.Phone,
            PsicologoId = patient.PsicologoId,
            PsicologoName = patient.Psicologo?.Name,
            ResponsibleId = patient.ResponsibleId,
            ResponsibleName = patient.Responsible?.Name,
            CreatedAt = patient.CreatedAt
        };
    }
}
