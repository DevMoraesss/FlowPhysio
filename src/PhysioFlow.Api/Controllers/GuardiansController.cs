using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;

namespace PhysioFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GuardiansController : ControllerBase
{
    private readonly IGuardianRepository _guardianRepository;

    public GuardiansController(IGuardianRepository guardianRepository)
    {
        _guardianRepository = guardianRepository;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<GuardianResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GuardianResponse>>> GetAll()
    {
        var guardians = await _guardianRepository.GetAllAsync();
        return Ok(guardians.Select(MapToResponse));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(GuardianResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GuardianResponse>> GetById(Guid id)
    {
        var guardian = await _guardianRepository.GetByIdWithPatientsAsync(id);
        if (guardian == null)
            return NotFound();

        return Ok(MapToResponse(guardian));
    }

    [HttpPost]
    [ProducesResponseType(typeof(GuardianResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<GuardianResponse>> Create([FromBody] CreateGuardianRequest request)
    {
        var guardian = new Guardian
        {
            FullName = request.FullName,
            Cpf = request.Cpf,
            Phone = request.Phone,
            Email = request.Email,
            ZipCode = request.ZipCode,
            Street = request.Street,
            Number = request.Number,
            Complement = request.Complement,
            Neighborhood = request.Neighborhood,
            City = request.City,
            State = request.State
        };

        await _guardianRepository.AddAsync(guardian);
        return CreatedAtAction(nameof(GetById), new { id = guardian.Id }, MapToResponse(guardian));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(GuardianResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GuardianResponse>> Update(Guid id, [FromBody] UpdateGuardianRequest request)
    {
        var guardian = await _guardianRepository.GetByIdAsync(id);
        if (guardian == null)
            return NotFound();

        if (request.FullName != null) guardian.FullName = request.FullName;
        if (request.Cpf != null) guardian.Cpf = request.Cpf;
        if (request.Phone != null) guardian.Phone = request.Phone;
        if (request.Email != null) guardian.Email = request.Email;
        if (request.ZipCode != null) guardian.ZipCode = request.ZipCode;
        if (request.Street != null) guardian.Street = request.Street;
        if (request.Number != null) guardian.Number = request.Number;
        if (request.Complement != null) guardian.Complement = request.Complement;
        if (request.Neighborhood != null) guardian.Neighborhood = request.Neighborhood;
        if (request.City != null) guardian.City = request.City;
        if (request.State != null) guardian.State = request.State;

        await _guardianRepository.UpdateAsync(guardian);
        return Ok(MapToResponse(guardian));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id)
    {
        if (!await _guardianRepository.ExistsAsync(id))
            return NotFound();

        await _guardianRepository.DeleteAsync(id);
        return NoContent();
    }

    private static GuardianResponse MapToResponse(Guardian guardian)
    {
        return new GuardianResponse
        {
            Id = guardian.Id,
            FullName = guardian.FullName,
            Cpf = guardian.Cpf,
            Phone = guardian.Phone,
            Email = guardian.Email,
            ZipCode = guardian.ZipCode,
            Street = guardian.Street,
            Number = guardian.Number,
            Complement = guardian.Complement,
            Neighborhood = guardian.Neighborhood,
            City = guardian.City,
            State = guardian.State,
            CreatedAt = guardian.CreatedAt
        };
    }
}
