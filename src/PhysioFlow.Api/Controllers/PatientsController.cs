using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Domain.Enums;

namespace PhysioFlow.Api.Controllers;

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

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PatientResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PatientResponse>>> GetAll()
    {
        var physioId = GetCurrentUserId();
        var patients = await _patientRepository.GetAllByPhysioAsync(physioId);
        return Ok(patients.Select(MapToResponse));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PatientResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientResponse>> GetById(Guid id)
    {
        var physioId = GetCurrentUserId();
        var patient = await _patientRepository.GetByIdWithDetailsAsync(id);
        if (patient == null || patient.PhysioId != physioId)
            return NotFound();

        return Ok(MapToResponse(patient));
    }

[HttpPost]
[ProducesResponseType(typeof(PatientResponse), StatusCodes.Status201Created)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
public async Task<ActionResult<PatientResponse>> Create([FromBody] CreatePatientRequest request)
{
    var physioId = GetCurrentUserId();

    // Validação 1 — CPF duplicado (dentro dos pacientes deste fisioterapeuta)
    var normalizedCpf = NormalizeCpf(request.Cpf);
    if (normalizedCpf != null)
    {
        var existing = await _patientRepository.GetAllByPhysioAsync(physioId);
        if (existing.Any(p => NormalizeCpf(p.Cpf) == normalizedCpf))
            return BadRequest(new { message = "Já existe um paciente com este CPF" });
    }


    // Validação 2 — menor de 18 anos deve ter responsável
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var age = today.Year - request.BirthDate.Year;
    if (request.BirthDate.AddYears(age) > today) age--;

    if (age < 18 && request.GuardianId == null)
        return BadRequest(new { message = "Paciente menor de 18 anos deve ter um responsável legal" });

    var patient = new Patient
    {
        PhysioId = physioId,
        GuardianId = request.GuardianId,
        FullName = request.FullName,
        BirthDate = request.BirthDate,
        Cpf = normalizedCpf,
        Phone = request.Phone,
        Email = request.Email,
        ZipCode = request.ZipCode,
        Street = request.Street,
        Number = request.Number,
        Complement = request.Complement,
        Neighborhood = request.Neighborhood,
        City = request.City,
        State = request.State,
        PaymentCycle = (PaymentCycle)request.PaymentCycle,
        PaymentDay = request.PaymentDay,
        DefaultSessionValue = request.DefaultSessionValue,
    };

    await _patientRepository.AddAsync(patient);
    return CreatedAtAction(nameof(GetById), new { id = patient.Id }, MapToResponse(patient));
}


    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(PatientResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientResponse>> Update(Guid id, [FromBody] UpdatePatientRequest request)
    {
        var physioId = GetCurrentUserId();
        var patient = await _patientRepository.GetByIdAsync(id);
        if (patient == null || patient.PhysioId != physioId)
            return NotFound();


        if (request.FullName != null) patient.FullName = request.FullName;
        if (request.Phone != null) patient.Phone = request.Phone;
        if (request.Email != null) patient.Email = request.Email;
        if (request.Cpf != null) patient.Cpf = NormalizeCpf(request.Cpf);
        if (request.ZipCode != null) patient.ZipCode = request.ZipCode;
        if (request.Street != null) patient.Street = request.Street;
        if (request.Number != null) patient.Number = request.Number;
        if (request.Complement != null) patient.Complement = request.Complement;
        if (request.Neighborhood != null) patient.Neighborhood = request.Neighborhood;
        if (request.City != null) patient.City = request.City;
        if (request.State != null) patient.State = request.State;
        if (request.GuardianId != null) patient.GuardianId = request.GuardianId;
        if (request.PaymentCycle != null) patient.PaymentCycle = (PaymentCycle)request.PaymentCycle;
        if (request.PaymentDay != null) patient.PaymentDay = request.PaymentDay;
        if (request.DefaultSessionValue != null) patient.DefaultSessionValue = request.DefaultSessionValue;


        await _patientRepository.UpdateAsync(patient);
        return Ok(MapToResponse(patient));
    }

    [HttpPatch("{id:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Deactivate(Guid id)
    {
        var physioId = GetCurrentUserId();
        var patient = await _patientRepository.GetByIdAsync(id);
        if (patient == null || patient.PhysioId != physioId)
            return NotFound();

        patient.IsActive = false;
        await _patientRepository.UpdateAsync(patient);
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
            FullName = patient.FullName,
            BirthDate = patient.BirthDate,
            Cpf = patient.Cpf,
            Phone = patient.Phone,
            Email = patient.Email,
            ZipCode = patient.ZipCode,
            Street = patient.Street,
            Number = patient.Number,
            Complement = patient.Complement,
            Neighborhood = patient.Neighborhood,
            City = patient.City,
            State = patient.State,
            IsActive = patient.IsActive,
            PhysioId = patient.PhysioId,
            GuardianId = patient.GuardianId,
            CreatedAt = patient.CreatedAt,
            PaymentCycle = (int)patient.PaymentCycle,
            PaymentDay = patient.PaymentDay,
            DefaultSessionValue = patient.DefaultSessionValue,
        };
    }

    private static string? NormalizeCpf(string? cpf) =>
        string.IsNullOrWhiteSpace(cpf) ? null : new string(cpf.Where(char.IsDigit).ToArray());
}
