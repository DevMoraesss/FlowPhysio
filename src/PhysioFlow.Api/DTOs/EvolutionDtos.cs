using System.ComponentModel.DataAnnotations;

namespace PhysioFlow.Api.DTOs;

public class EvolutionResponse
{
    public Guid Id { get; set; }
    public Guid AppointmentId { get; set; }
    public Guid PatientId { get; set; }
    public string ProceduresPerformed { get; set; } = string.Empty;
    public string? TechniquesApplied { get; set; }
    public int? PainScale { get; set; }
    public string ClinicalNotes { get; set; } = string.Empty;
    public string? NextSessionPlan { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateEvolutionRequest
{
    [Required]
    public Guid AppointmentId { get; set; }

    [Required]
    public string ProceduresPerformed { get; set; } = string.Empty;

    public string? TechniquesApplied { get; set; }

    [Range(0, 10, ErrorMessage = "Escala de dor deve ser entre 0 e 10")]
    public int? PainScale { get; set; }

    [Required]
    public string ClinicalNotes { get; set; } = string.Empty;

    public string? NextSessionPlan { get; set; }
}

public class UpdateEvolutionRequest
{
    public string? ProceduresPerformed { get; set; }
    public string? TechniquesApplied { get; set; }

    [Range(0, 10, ErrorMessage = "Escala de dor deve ser entre 0 e 10")]
    public int? PainScale { get; set; }
    public string? ClinicalNotes { get; set; }
    public string? NextSessionPlan { get; set; }
}
