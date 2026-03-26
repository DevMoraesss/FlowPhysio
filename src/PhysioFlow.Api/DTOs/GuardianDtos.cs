using System.ComponentModel.DataAnnotations;

namespace PhysioFlow.Api.DTOs;

public class GuardianResponse
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Cpf { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string ZipCode { get; set; } = string.Empty;
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateGuardianRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    public string? Cpf { get; set; }

    [Required(ErrorMessage = "Telefone é obrigatório")]
    public string Phone { get; set; } = string.Empty;

    public string? Email { get; set; }

    [Required(ErrorMessage = "CEP é obrigatório")]
    public string ZipCode { get; set; } = string.Empty;

    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
}

public class UpdateGuardianRequest
{
    [MaxLength(200)]
    public string? FullName { get; set; }
    public string? Cpf { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ZipCode { get; set; }
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
}
