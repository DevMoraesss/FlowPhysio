using System.ComponentModel.DataAnnotations;

namespace PsicoFlow.Api.DTOs;

public class ClinicalRecordResponse
{
    public Guid Id { get; set; }
    public Guid ConsultationId { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? TherapeuticGoals { get; set; }
    public string? Observations { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<AttachmentResponse> Attachments { get; set; } = new();
}

public class CreateClinicalRecordRequest
{
    [Required(ErrorMessage = "ConsultationId é obrigatório")]
    public Guid ConsultationId { get; set; }

    [MaxLength(5000)]
    public string? Summary { get; set; }

    [MaxLength(2000)]
    public string? TherapeuticGoals { get; set; }

    [MaxLength(2000)]
    public string? Observations { get; set; }
}

public class UpdateClinicalRecordRequest
{
    [MaxLength(5000)]
    public string? Summary { get; set; }

    [MaxLength(2000)]
    public string? TherapeuticGoals { get; set; }

    [MaxLength(2000)]
    public string? Observations { get; set; }
}

public class AttachmentResponse
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long FileSize { get; set; }
    public DateTime CreatedAt { get; set; }
}
