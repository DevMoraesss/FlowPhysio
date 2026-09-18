using System.ComponentModel.DataAnnotations;

namespace PhysioFlow.Api.DTOs;

public class PatientResponse
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
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
    public int? PaymentDay { get; set; }
    public DateTime CreatedAt { get; set; }
    public decimal? DefaultSessionValue { get; set; }

    public int RegistrationStatus { get; set; }
    public bool IsDraft { get; set; }
}


//Pré-cadastro feito pela agenda, quando a paciente liga para marcar e a
//fisioterapeuta ainda não tem os dados completos. Só nome e telefone.

public class CreateQuickPatientRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    // Obrigatório de propósito: é o que a fisioterapeuta usa para retornar o
    // contato, e é o identificador que evita cadastrar a mesma pessoa duas vezes.
    [Required(ErrorMessage = "Telefone é obrigatório no pré-cadastro")]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    /// <summary>Opcional - se a fisioterapeuta souber o CPF já no telefonema.
    public string? Cpf { get; set; }
}

///Resultado enxuto da busca usada para não duplicar paciente.
public class PatientSearchResult
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Cpf { get; set; }
    public DateOnly? BirthDate { get; set; }
    public bool IsActive { get; set; }
    public bool IsDraft { get; set; }
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
    public int? PaymentDay { get; set; }
    public decimal? DefaultSessionValue { get; set; }

}

public class UpdatePatientRequest
{
    [MaxLength(200)]
    public string? FullName { get; set; }
    public DateOnly? BirthDate { get; set; }
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
    /// <summary>Desvincula o responsável legal (usado quando o cadastro deixa de ter responsável).
    public bool? RemoveGuardian { get; set; }
    public int? PaymentCycle { get; set; }
    public int? PaymentDay { get; set; }
    public decimal? DefaultSessionValue { get; set; }

}
