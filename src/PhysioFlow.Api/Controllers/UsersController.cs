using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Domain.Validation;

namespace PhysioFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public UsersController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserResponse>> GetCurrentUser()
    {
        var userId = GetCurrentUserId();
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return NotFound();

        return Ok(MapToResponse(user));
    }

    [HttpPut("me")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserResponse>> Update([FromBody] UpdateUserRequest request)
    {
        var userId = GetCurrentUserId();
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
            return NotFound();

        // CPF válido e não duplicado - ignorando o próprio usuário
        if (!Cpf.IsValid(request.Cpf))
            return BadRequest(new { message = "CPF inválido" });

        var normalizedCpf = Cpf.Normalize(request.Cpf);
        if (normalizedCpf != null && normalizedCpf != user.Cpf)
        {
            var duplicate = await _userRepository.GetByCpfAsync(normalizedCpf);
            if (duplicate != null && duplicate.Id != userId)
                return BadRequest(new { message = "Já existe um cadastro com este CPF" });
        }

        if (request.FullName != null) user.FullName = request.FullName;
        if (request.Phone != null) user.Phone = request.Phone;
        if (request.Cpf != null) user.Cpf = normalizedCpf;
        if (request.Crefito != null) user.Crefito = request.Crefito;

        await _userRepository.UpdateAsync(user);
        return Ok(MapToResponse(user));
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }

    private static UserResponse MapToResponse(User user)
    {
        return new UserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Cpf = user.Cpf,
            Crefito = user.Crefito,
            CreatedAt = user.CreatedAt
        };
    }
}
