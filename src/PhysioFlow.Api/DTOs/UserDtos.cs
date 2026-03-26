using System.ComponentModel.DataAnnotations;

namespace PhysioFlow.Api.DTOs;

public class UserResponse
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Cpf { get; set; }
    public string? Crefito { get; set; }
    public DateTime CreatedAt { get; set; }
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
    [MinLength(6, ErrorMessage = "Senha deve ter no mínimo 6 caracteres")]
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
