using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Enums;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Domain.Validation;

namespace PhysioFlow.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<User> CreateAccountAsync(CreateUserRequest request, UserRole role, bool mustChangePassword);
    Task EnsureAdministratorAsync(string email, string password);
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
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Email ou senha inválidos");
        }

        // Só depois de a senha conferir: assim a mensagem não revela, para quem não sabe a
        // senha, que aquela conta existe.
        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Esta conta está desativada. Fale com o administrador do sistema.");
        }

        return new AuthResponse
        {
            User = UserResponse.From(user),
            AccessToken = GenerateJwtToken(user)
        };
    }

    /// <summary>
    /// Cria uma conta. Não existe mais cadastro público: quem chama é o administrador, pela
    /// área de contas, ou a subida da API, para o primeiro administrador.
    /// </summary>
    public async Task<User> CreateAccountAsync(CreateUserRequest request, UserRole role, bool mustChangePassword)
    {
        var existing = await _userRepository.GetByEmailAsync(request.Email);
        if (existing != null)
        {
            throw new InvalidOperationException("Email já cadastrado");
        }

        if (!Cpf.IsValid(request.Cpf))
        {
            throw new InvalidOperationException("CPF inválido");
        }

        var normalizedCpf = Cpf.Normalize(request.Cpf);
        if (normalizedCpf != null && await _userRepository.GetByCpfAsync(normalizedCpf) != null)
        {
            throw new InvalidOperationException("CPF já cadastrado");
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Phone = request.Phone,
            Cpf = normalizedCpf,
            Crefito = request.Crefito,
            Role = role,
            MustChangePassword = mustChangePassword
        };

        return await _userRepository.AddAsync(user);
    }

    /// <summary>
    /// Garante que exista o administrador configurado em Admin__Email e Admin__Password.
    /// Roda na subida da API. Se a conta já existe, não mexe nela: nem na senha, nem no perfil.
    /// Assim trocar a variável de ambiente não muda a senha de ninguém sem aviso.
    /// </summary>
    public async Task EnsureAdministratorAsync(string email, string password)
    {
        if (await _userRepository.GetByEmailAsync(email) != null)
            return;

        await CreateAccountAsync(new CreateUserRequest
        {
            FullName = "Administrador",
            Email = email,
            Password = password
        }, UserRole.Administrator, mustChangePassword: false);
    }

    private string GenerateJwtToken(User user)
    {
        // O Program.cs ja recusa subir sem esta chave, entao aqui ela sempre
        // existe. A checagem fica como rede de seguranca: se alguem um dia
        // remover a validacao do start, o erro aponta a causa em vez de
        // estourar um NullReferenceException sem explicacao.
        var secret = _configuration["Jwt:Secret"];
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("Jwt:Secret nao configurado.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            // O perfil vai no token. É ele que o [Authorize(Roles = ...)] de cada controller confere
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
}
