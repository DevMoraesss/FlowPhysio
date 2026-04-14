using System.ComponentModel.DataAnnotations;

namespace PhysioFlow.Api.DTOs;

public class PatientResponse
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public DateOnly BirthDate { get; set; }
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
    public bool IsActive { get; set; }
    public Guid PhysioId { get; set; }
    public Guid? GuardianId { get; set; }
    public int PaymentCycle { get; set; }
    public string? PaymentDay { get; set; }
    public DateTime CreatedAt { get; set; }
    public decimal? DefaultSessionValue { get; set; }

}

public class CreatePatientRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Data de nascimento é obrigatória")]
    public DateOnly BirthDate { get; set; }

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
    public Guid? GuardianId { get; set; }
    public int PaymentCycle { get; set; } = 1;
    public string? PaymentDay { get; set; }
    public decimal? DefaultSessionValue { get; set; }

}

public class UpdatePatientRequest
{
    [MaxLength(200)]
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Cpf { get; set; }
    public string? ZipCode { get; set; }
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public Guid? GuardianId { get; set; }
    public int? PaymentCycle { get; set; }
    public string? PaymentDay { get; set; }
    public decimal? DefaultSessionValue { get; set; }

}
