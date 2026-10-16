using System.ComponentModel.DataAnnotations;
using PhysioFlow.Domain.Entities;

namespace PhysioFlow.Api.DTOs;

public class UserResponse
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Cpf { get; set; }
    public string? Crefito { get; set; }

    // "Physiotherapist" ou "Administrator". A tela usa para montar o menu certo.
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    // Verdadeiro quando a senha foi definida pelo administrador. A tela manda direto para a troca
    public bool MustChangePassword { get; set; }
    public DateTime CreatedAt { get; set; }

    public static UserResponse From(User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Phone = user.Phone,
        Cpf = user.Cpf,
        Crefito = user.Crefito,
        Role = user.Role.ToString(),
        IsActive = user.IsActive,
        MustChangePassword = user.MustChangePassword,
        CreatedAt = user.CreatedAt
    };
}

/// <summary>
/// Regra de senha, num lugar só: vale para a conta criada pelo administrador e para a senha
/// redefinida por ele.
/// </summary>
public static class PasswordRules
{
    public const int MinLength = 8;
    public const string Pattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$";
    public const string Message = "Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número";
}

public class CreateUserRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Senha é obrigatória")]
    [MinLength(PasswordRules.MinLength, ErrorMessage = "Senha deve ter no mínimo 8 caracteres")]
    [RegularExpression(PasswordRules.Pattern, ErrorMessage = PasswordRules.Message)]
    public string Password { get; set; } = string.Empty;

    public string? Phone { get; set; }
    public string? Cpf { get; set; }
    public string? Crefito { get; set; }
}

public class UpdateUserRequest
{
    [MaxLength(200)]
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? Cpf { get; set; }
    public string? Crefito { get; set; }
}

public class ResetPasswordRequest
{
    [Required(ErrorMessage = "Senha é obrigatória")]
    [MinLength(PasswordRules.MinLength, ErrorMessage = "Senha deve ter no mínimo 8 caracteres")]
    [RegularExpression(PasswordRules.Pattern, ErrorMessage = PasswordRules.Message)]
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Informe a senha atual")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Informe a nova senha")]
    [MinLength(PasswordRules.MinLength, ErrorMessage = "Senha deve ter no mínimo 8 caracteres")]
    [RegularExpression(PasswordRules.Pattern, ErrorMessage = PasswordRules.Message)]
    public string NewPassword { get; set; } = string.Empty;
}
