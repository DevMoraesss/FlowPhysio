using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Api.Services;
using PhysioFlow.Domain.Enums;
using PhysioFlow.Domain.Interfaces;

namespace PhysioFlow.Api.Controllers;

/// <summary>
/// Gestão de contas. Só o perfil Administrador entra aqui; qualquer outro recebe 403.
///
/// O administrador vê nome, e-mail, CREFITO e situação das contas. Nada de paciente, agenda ou
/// prontuário: esses controllers exigem o perfil Fisioterapeuta, então o administrador também
/// recebe 403 se tentar abri-los.
/// </summary>
[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = nameof(UserRole.Administrator))]
public class AdminController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IAuthService _authService;

    public AdminController(IUserRepository userRepository, IAuthService authService)
    {
        _userRepository = userRepository;
        _authService = authService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetAll()
    {
        var users = await _userRepository.GetAllAsync();
        return Ok(users.OrderBy(u => u.FullName).Select(UserResponse.From));
    }

    /// <summary>
    /// Cria uma conta de fisioterapeuta com a senha provisória que o administrador informar.
    /// No primeiro acesso a pessoa é obrigada a trocar, então o administrador não fica sabendo a
    /// senha de uso.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserResponse>> Create([FromBody] CreateUserRequest request)
    {
        try
        {
            var user = await _authService.CreateAccountAsync(request, UserRole.Physiotherapist, mustChangePassword: true);
            return CreatedAtAction(nameof(GetAll), UserResponse.From(user));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/deactivate")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponse>> Deactivate(Guid id)
    {
        // Sem esta trava, o único administrador poderia se trancar fora do sistema
        if (id == GetCurrentUserId())
            return BadRequest(new { message = "Você não pode desativar a sua própria conta" });

        return await SetActive(id, false);
    }

    [HttpPatch("{id:guid}/activate")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<ActionResult<UserResponse>> Activate(Guid id) => SetActive(id, true);

    /// <summary>
    /// Define uma senha provisória para quem esqueceu a sua. O sistema não tem "esqueci minha
    /// senha" por e-mail, então este é o caminho. No próximo acesso a pessoa troca por uma dela.
    /// </summary>
    [HttpPut("{id:guid}/password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "Conta não encontrada" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.MustChangePassword = true;
        await _userRepository.UpdateAsync(user);
        return NoContent();
    }

    private async Task<ActionResult<UserResponse>> SetActive(Guid id, bool active)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "Conta não encontrada" });

        user.IsActive = active;
        await _userRepository.UpdateAsync(user);
        return Ok(UserResponse.From(user));
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }
}
