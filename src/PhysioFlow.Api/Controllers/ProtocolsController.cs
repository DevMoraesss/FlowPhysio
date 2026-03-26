using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;

namespace PhysioFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProtocolsController : ControllerBase
{
    private readonly IProtocolRepository _protocolRepository;
    private readonly IPatientRepository _patientRepository;

    public ProtocolsController(
        IProtocolRepository protocolRepository,
        IPatientRepository patientRepository)
    {
        _protocolRepository = protocolRepository;
        _patientRepository = patientRepository;
    }

    [HttpGet("patient/{patientId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<ProtocolResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProtocolResponse>>> GetByPatient(Guid patientId)
    {
        var protocols = await _protocolRepository.GetAllByPatientAsync(patientId);
        return Ok(protocols.Select(MapToResponse));
    }

    [HttpGet("patient/{patientId:guid}/active")]
    [ProducesResponseType(typeof(IEnumerable<ProtocolResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProtocolResponse>>> GetActiveByPatient(Guid patientId)
    {
        var protocols = await _protocolRepository.GetActiveByPatientAsync(patientId);
        return Ok(protocols.Select(MapToResponse));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProtocolResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProtocolResponse>> GetById(Guid id)
    {
        var protocol = await _protocolRepository.GetByIdAsync(id);
        if (protocol == null)
            return NotFound();

        return Ok(MapToResponse(protocol));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProtocolResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProtocolResponse>> Create([FromBody] CreateProtocolRequest request)
    {
        var patient = await _patientRepository.GetByIdAsync(request.PatientId);
        if (patient == null)
            return NotFound(new { message = "Paciente não encontrado" });

        var protocol = new Protocol
        {
            PatientId = request.PatientId,
            TreatmentName = request.TreatmentName,
            TotalCycles = request.TotalCycles,
            SessionsPerCycle = request.SessionsPerCycle,
            CurrentCycle = 1,
            CompletedSessions = 0,
            IsActive = true
        };

        await _protocolRepository.AddAsync(protocol);
        return CreatedAtAction(nameof(GetById), new { id = protocol.Id }, MapToResponse(protocol));
    }

    [HttpPost("{id:guid}/complete-session")]
    [ProducesResponseType(typeof(ProtocolResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProtocolResponse>> CompleteSession(Guid id)
    {
        var protocol = await _protocolRepository.GetByIdAsync(id);
        if (protocol == null)
            return NotFound();

        if (!protocol.IsActive)
            return BadRequest(new { message = "Protocolo encerrado" });

        if (protocol.CurrentCycle > protocol.TotalCycles)
            return BadRequest(new { message = "Todos os ciclos já foram concluídos" });

        protocol.CompletedSessions++;

        if (protocol.CompletedSessions >= protocol.SessionsPerCycle)
        {
            if (protocol.CurrentCycle >= protocol.TotalCycles)
            {
                protocol.IsActive = false;
            }
            else
            {
                protocol.CurrentCycle++;
                protocol.CompletedSessions = 0;
            }
        }

        await _protocolRepository.UpdateAsync(protocol);
        return Ok(MapToResponse(protocol));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ProtocolResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProtocolResponse>> Update(Guid id, [FromBody] UpdateProtocolRequest request)
    {
        var protocol = await _protocolRepository.GetByIdAsync(id);
        if (protocol == null)
            return NotFound();

        if (request.TreatmentName != null) protocol.TreatmentName = request.TreatmentName;
        if (request.IsActive.HasValue) protocol.IsActive = request.IsActive.Value;

        await _protocolRepository.UpdateAsync(protocol);
        return Ok(MapToResponse(protocol));
    }

    private static ProtocolResponse MapToResponse(Protocol protocol)
    {
        return new ProtocolResponse
        {
            Id = protocol.Id,
            PatientId = protocol.PatientId,
            TreatmentName = protocol.TreatmentName,
            CurrentCycle = protocol.CurrentCycle,
            TotalCycles = protocol.TotalCycles,
            SessionsPerCycle = protocol.SessionsPerCycle,
            CompletedSessions = protocol.CompletedSessions,
            IsActive = protocol.IsActive,
            CreatedAt = protocol.CreatedAt
        };
    }
}
