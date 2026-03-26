using System.ComponentModel.DataAnnotations;

namespace PhysioFlow.Api.DTOs;

public class ProtocolResponse
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string TreatmentName { get; set; } = string.Empty;
    public int CurrentCycle { get; set; }
    public int TotalCycles { get; set; }
    public int SessionsPerCycle { get; set; }
    public int CompletedSessions { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateProtocolRequest
{
    [Required]
    public Guid PatientId { get; set; }

    [Required]
    [MaxLength(200)]
    public string TreatmentName { get; set; } = string.Empty;

    [Required]
    [Range(1, 100)]
    public int TotalCycles { get; set; }

    [Required]
    [Range(1, 100)]
    public int SessionsPerCycle { get; set; }
}

public class UpdateProtocolRequest
{
    [MaxLength(200)]
    public string? TreatmentName { get; set; }
    public bool? IsActive { get; set; }
}
