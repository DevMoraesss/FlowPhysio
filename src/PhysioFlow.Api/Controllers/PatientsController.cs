using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Domain.Enums;
using PhysioFlow.Domain.Validation;

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

    // Validação 1 - CPF válido e não duplicado (entre os pacientes deste fisioterapeuta)
    if (!Cpf.IsValid(request.Cpf))
        return BadRequest(new { message = "CPF inválido" });

    var normalizedCpf = Cpf.Normalize(request.Cpf);
    if (normalizedCpf != null)
    {
        var existing = await _patientRepository.GetAllByPhysioAsync(physioId);
        if (existing.Any(p => Cpf.Normalize(p.Cpf) == normalizedCpf))
            return BadRequest(new { message = "Já existe um paciente com este CPF" });
    }


    // Validação 2 - menor de 18 anos deve ter responsável
    if (CalculateAge(request.BirthDate) < 18 && request.GuardianId == null)
        return BadRequest(new { message = "Paciente menor de 18 anos deve ter um responsável legal" });

    // Validação 3 - ciclo válido e dia de pagamento coerente com o ciclo
    var paymentCycle = (PaymentCycle)request.PaymentCycle;
    if (!Enum.IsDefined(paymentCycle))
        return BadRequest(new { message = "Ciclo de pagamento inválido" });

    var paymentDay = paymentCycle == PaymentCycle.PerSession ? null : request.PaymentDay;
    var paymentDayError = ValidatePaymentDay(paymentCycle, paymentDay);
    if (paymentDayError != null)
        return BadRequest(new { message = paymentDayError });

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
        PaymentCycle = paymentCycle,
        PaymentDay = paymentDay,
        DefaultSessionValue = request.DefaultSessionValue,
    };

    await _patientRepository.AddAsync(patient);
    return CreatedAtAction(nameof(GetById), new { id = patient.Id }, MapToResponse(patient));
}

    /// <summary>
    /// Pré-cadastro: cria um paciente só com nome e telefone, para a
    /// fisioterapeuta conseguir agendar durante o telefonema.
    ///
    /// Regras normais que NÃO se aplicam aqui, e por quê:
    ///  - data de nascimento: ela não tem no telefonema - é o que trava hoje;
    ///  - responsável para menor: sem data de nascimento não dá para saber a
    ///    idade, então a regra só passa a valer quando o cadastro for completado.
    ///
    /// Em troca, o paciente nasce como Draft e fica impedido de receber
    /// avaliação, evolução e protocolo até alguém completar o cadastro.
    /// </summary>
    [HttpPost("quick")]
    [ProducesResponseType(typeof(PatientResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PatientResponse>> CreateQuick([FromBody] CreateQuickPatientRequest request)
    {
        var physioId = GetCurrentUserId();

        if (string.IsNullOrWhiteSpace(request.Phone))
            return BadRequest(new { message = "Telefone é obrigatório no pré-cadastro" });

        if (!Cpf.IsValid(request.Cpf))
            return BadRequest(new { message = "CPF inválido" });

        var normalizedCpf = Cpf.Normalize(request.Cpf);
        if (normalizedCpf != null)
        {
            var existing = await _patientRepository.GetAllByPhysioAsync(physioId);
            if (existing.Any(p => Cpf.Normalize(p.Cpf) == normalizedCpf))
                return BadRequest(new { message = "Já existe um paciente com este CPF" });
        }

        var patient = new Patient
        {
            PhysioId = physioId,
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            Cpf = normalizedCpf,
            RegistrationStatus = RegistrationStatus.Draft,
        };

        await _patientRepository.AddAsync(patient);
        return CreatedAtAction(nameof(GetById), new { id = patient.Id }, MapToResponse(patient));
    }

    /// <summary>
    /// Busca por nome, telefone ou CPF. Serve para a tela mostrar "já existe
    /// alguém parecido" ANTES de criar um pré-cadastro - é o que impede a
    /// mesma paciente de virar três cadastros diferentes ao longo do tempo.
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<PatientSearchResult>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PatientSearchResult>>> Search([FromQuery] string? term)
    {
        if (string.IsNullOrWhiteSpace(term) || term.Trim().Length < 3)
            return Ok(Array.Empty<PatientSearchResult>());

        var physioId = GetCurrentUserId();
        var patients = await _patientRepository.GetAllByPhysioAsync(physioId);

        var raw = term.Trim();
        var digits = new string(raw.Where(char.IsDigit).ToArray());

        var matches = patients.Where(p =>
            p.FullName.Contains(raw, StringComparison.OrdinalIgnoreCase)
            || (digits.Length >= 3 && OnlyDigits(p.Phone).Contains(digits))
            || (digits.Length >= 3 && (Cpf.Normalize(p.Cpf) ?? "").Contains(digits)));

        return Ok(matches
            .OrderBy(p => p.FullName)
            .Take(10)
            .Select(p => new PatientSearchResult
            {
                Id = p.Id,
                FullName = p.FullName,
                Phone = p.Phone,
                Cpf = p.Cpf,
                BirthDate = p.BirthDate,
                IsActive = p.IsActive,
                IsDraft = p.IsDraft,
            }));
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


        // CPF válido e não duplicado - mesma regra do cadastro, ignorando o próprio paciente
        if (!Cpf.IsValid(request.Cpf))
            return BadRequest(new { message = "CPF inválido" });

        var normalizedCpf = Cpf.Normalize(request.Cpf);
        if (normalizedCpf != null && normalizedCpf != patient.Cpf)
        {
            var existing = await _patientRepository.GetAllByPhysioAsync(physioId);
            if (existing.Any(p => p.Id != id && Cpf.Normalize(p.Cpf) == normalizedCpf))
                return BadRequest(new { message = "Já existe um paciente com este CPF" });
        }

        if (request.FullName != null) patient.FullName = request.FullName;
        if (request.BirthDate != null) patient.BirthDate = request.BirthDate.Value;
        if (request.Phone != null) patient.Phone = request.Phone;

        if (request.Email != null) patient.Email = request.Email;
        if (request.Cpf != null) patient.Cpf = normalizedCpf;
        if (request.ZipCode != null) patient.ZipCode = request.ZipCode;
        if (request.Street != null) patient.Street = request.Street;
        if (request.Number != null) patient.Number = request.Number;
        if (request.Complement != null) patient.Complement = request.Complement;
        if (request.Neighborhood != null) patient.Neighborhood = request.Neighborhood;
        if (request.City != null) patient.City = request.City;
        if (request.State != null) patient.State = request.State;
        // RemoveGuardian tem precedência: permite desvincular o responsável explicitamente
        if (request.RemoveGuardian == true) patient.GuardianId = null;
        else if (request.GuardianId != null) patient.GuardianId = request.GuardianId;
        if (request.PaymentCycle != null)
        {
            var newCycle = (PaymentCycle)request.PaymentCycle;
            if (!Enum.IsDefined(newCycle))
                return BadRequest(new { message = "Ciclo de pagamento inválido" });
            patient.PaymentCycle = newCycle;
        }
        if (request.PaymentDay != null) patient.PaymentDay = request.PaymentDay;
        if (request.DefaultSessionValue != null) patient.DefaultSessionValue = request.DefaultSessionValue;

        // Dia de pagamento não se aplica a "Por Sessão" e deve ser coerente com o ciclo final
        if (patient.PaymentCycle == PaymentCycle.PerSession) patient.PaymentDay = null;
        var paymentDayError = ValidatePaymentDay(patient.PaymentCycle, patient.PaymentDay);
        if (paymentDayError != null)
            return BadRequest(new { message = paymentDayError });

        // Menor de 18 anos deve ter responsável legal (mesma regra do cadastro).
        // Só vale quando existe data de nascimento: no pré-cadastro ela ainda é
        // desconhecida, então não há como aferir a idade.
        var age = patient.AgeInYears(DateOnly.FromDateTime(DateTime.UtcNow));
        if (age is < 18 && patient.GuardianId == null)
            return BadRequest(new { message = "Paciente menor de 18 anos deve ter um responsável legal" });

        // Preencher a data de nascimento é o que transforma um pré-cadastro em
        // cadastro completo - e libera avaliação, evolução e protocolo.
        patient.CompleteRegistrationIfPossible();

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

    [HttpPatch("{id:guid}/activate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Activate(Guid id)
    {
        var physioId = GetCurrentUserId();
        var patient = await _patientRepository.GetByIdAsync(id);
        if (patient == null || patient.PhysioId != physioId)
            return NotFound();

        patient.IsActive = true;
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
            RegistrationStatus = (int)patient.RegistrationStatus,
            IsDraft = patient.IsDraft,
        };
    }

    private static int CalculateAge(DateOnly birthDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - birthDate.Year;
        if (birthDate.AddYears(age) > today) age--;
        return age;
    }

    private static string OnlyDigits(string? value) =>
        string.IsNullOrEmpty(value) ? "" : new string(value.Where(char.IsDigit).ToArray());


    // Mensal/Quinzenal: dia do mês (1-31); Semanal: dia da semana (1=segunda ... 7=domingo)
    private static string? ValidatePaymentDay(PaymentCycle cycle, int? day)
    {
        if (day == null) return null;
        return cycle switch
        {
            PaymentCycle.Weekly when day is < 1 or > 7 =>
                "Para ciclo semanal, o dia de pagamento deve ser entre 1 (segunda-feira) e 7 (domingo)",
            PaymentCycle.Monthly or PaymentCycle.Biweekly when day is < 1 or > 31 =>
                "O dia de pagamento deve ser um dia do mês entre 1 e 31",
            _ => null
        };
    }
}
