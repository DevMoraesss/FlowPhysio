using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using PsicoFlow.Api.DTOs;
using PsicoFlow.Api.DTOs.Auth;
using PsicoFlow.Domain.Entities;
using PsicoFlow.Domain.Interfaces;
using BCrypt.Net;

namespace PsicoFlow.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task ForgotPasswordAsync(ForgotPasswordRequest request);
    Task ResetPasswordAsync(ResetPasswordRequest request);
    Task<User> RegisterAsync(CreateUserRequest request);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Email ou senha inválidos");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Email ou senha inválidos");
        }

        var token = GenerateJwtToken(user);

        return new AuthResponse
        {
            User = MapToUserResponse(user),
            AccessToken = token
        };
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            // Don't reveal if email exists
            return;
        }

        user.PasswordResetToken = Guid.NewGuid().ToString("N");
        user.PasswordResetExpires = DateTime.UtcNow.AddHours(1);

        await _userRepository.UpdateAsync(user);

        // TODO: Send email with reset link
        // await _emailService.SendPasswordResetEmail(user.Email, user.PasswordResetToken);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _userRepository.GetByResetTokenAsync(request.Token);
        if (user == null || user.PasswordResetExpires < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Token inválido ou expirado");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        user.PasswordResetToken = null;
        user.PasswordResetExpires = null;

        await _userRepository.UpdateAsync(user);
    }

    public async Task<User> RegisterAsync(CreateUserRequest request)
    {
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("Email já cadastrado");
        }

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Phone = request.Phone,
            BirthDate = request.BirthDate,
            Cpf = request.Cpf,
            Rg = request.Rg,
            Role = request.Role,
            Address = request.Address != null ? new Address
            {
                Street = request.Address.Street,
                Number = request.Address.Number,
                Complement = request.Address.Complement,
                Neighborhood = request.Address.Neighborhood,
                City = request.Address.City,
                State = request.Address.State,
                ZipCode = request.Address.ZipCode
            } : null
        };

        return await _userRepository.AddAsync(user);
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserResponse MapToUserResponse(User user)
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
