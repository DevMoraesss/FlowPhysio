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

        return Ok(UserResponse.From(user));
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
        return Ok(UserResponse.From(user));
    }

    /// <summary>
    /// Troca a própria senha. Vale para os dois perfis e é a única rota liberada enquanto a senha
    /// for provisória. Pede a senha atual: quem pegou o computador com a sessão aberta não troca.
    /// </summary>
    [HttpPut("me/password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var user = await _userRepository.GetByIdAsync(GetCurrentUserId());
        if (user == null)
            return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "A senha atual não confere" });

        if (request.CurrentPassword == request.NewPassword)
            return BadRequest(new { message = "A nova senha precisa ser diferente da atual" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.MustChangePassword = false;
        await _userRepository.UpdateAsync(user);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }
}
