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
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public UsersController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    /// <summary>
    /// Get current authenticated user
    /// </summary>
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

    /// <summary>
    /// Get all users (Admin only)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<UserResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetAll()
    {
        var users = await _userRepository.GetAllAsync();
        return Ok(users.Select(MapToResponse));
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponse>> GetById(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            return NotFound();

        return Ok(MapToResponse(user));
    }

    /// <summary>
    /// Update user
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponse>> Update(Guid id, [FromBody] UpdateUserRequest request)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            return NotFound();

        // Only allow users to update their own profile (unless admin)
        var currentUserId = GetCurrentUserId();
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (user.Id != currentUserId && currentUserRole != "Admin")
            return Forbid();

        if (request.Name != null) user.Name = request.Name;
        if (request.Phone != null) user.Phone = request.Phone;
        if (request.BirthDate != null) user.BirthDate = request.BirthDate;
        if (request.Cpf != null) user.Cpf = request.Cpf;
        if (request.Rg != null) user.Rg = request.Rg;
        if (request.Address != null)
        {
            user.Address = new Address
            {
                Street = request.Address.Street,
                Number = request.Address.Number,
                Complement = request.Address.Complement,
                Neighborhood = request.Address.Neighborhood,
                City = request.Address.City,
                State = request.Address.State,
                ZipCode = request.Address.ZipCode
            };
        }

        await _userRepository.UpdateAsync(user);
        return Ok(MapToResponse(user));
    }

    /// <summary>
    /// Delete user (Admin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id)
    {
        if (!await _userRepository.ExistsAsync(id))
            return NotFound();

        await _userRepository.DeleteAsync(id);
        return NoContent();
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
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            BirthDate = user.BirthDate,
            Cpf = user.Cpf,
            Role = user.Role,
            CreatedAt = user.CreatedAt,
            Address = user.Address != null ? new AddressDto
            {
                Street = user.Address.Street,
                Number = user.Address.Number,
                Complement = user.Address.Complement,
                Neighborhood = user.Address.Neighborhood,
                City = user.Address.City,
                State = user.Address.State,
                ZipCode = user.Address.ZipCode
            } : null
        };
    }
}
