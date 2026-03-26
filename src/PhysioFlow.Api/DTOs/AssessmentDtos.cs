using System.ComponentModel.DataAnnotations;
using PhysioFlow.Domain.Enums;

namespace PhysioFlow.Api.DTOs;

public class AssessmentResponse
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public AssessmentType Type { get; set; }
    public DateTime AssessmentDate { get; set; }
    public string AnamnesisAnswers { get; set; } = string.Empty;
    public string? GeneralNotes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAssessmentRequest
{
    [Required]
    public Guid PatientId { get; set; }

    [Required]
    public AssessmentType Type { get; set; }

    [Required]
    public DateTime AssessmentDate { get; set; }

    [Required]
    public string AnamnesisAnswers { get; set; } = string.Empty;

    public string? GeneralNotes { get; set; }
}

public class UpdateAssessmentRequest
{
    public string? AnamnesisAnswers { get; set; }
    public string? GeneralNotes { get; set; }
}
