using System.ComponentModel.DataAnnotations;
using PsicoFlow.Domain.Enums;

namespace PsicoFlow.Api.DTOs;

public class UserResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Cpf { get; set; }
    public Role Role { get; set; }
    public AddressDto? Address { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateUserRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Senha é obrigatória")]
    [MinLength(6, ErrorMessage = "Senha deve ter no mínimo 6 caracteres")]
    public string Password { get; set; } = string.Empty;

    public string? Phone { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Cpf { get; set; }
    public string? Rg { get; set; }
    public Role Role { get; set; } = Role.Psicologo;
    public AddressDto? Address { get; set; }
}

public class UpdateUserRequest
{
    [MaxLength(200)]
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Cpf { get; set; }
    public string? Rg { get; set; }
    public AddressDto? Address { get; set; }
}

public class AddressDto
{
    public string? Street { get; set; }
    public int? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
}
