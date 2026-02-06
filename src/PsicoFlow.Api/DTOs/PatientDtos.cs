using System.ComponentModel.DataAnnotations;

namespace PsicoFlow.Api.DTOs;

public class PatientResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public Guid PsicologoId { get; set; }
    public string? PsicologoName { get; set; }
    public Guid? ResponsibleId { get; set; }
    public string? ResponsibleName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePatientRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public DateTime? BirthDate { get; set; }

    [EmailAddress(ErrorMessage = "Email inválido")]
    public string? Email { get; set; }

    public string? Phone { get; set; }
    public Guid? ResponsibleId { get; set; }
}

public class UpdatePatientRequest
{
    [MaxLength(200)]
    public string? Name { get; set; }
    public DateTime? BirthDate { get; set; }

    [EmailAddress(ErrorMessage = "Email inválido")]
    public string? Email { get; set; }

    public string? Phone { get; set; }
    public Guid? ResponsibleId { get; set; }
}
