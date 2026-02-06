using System.ComponentModel.DataAnnotations;
using PsicoFlow.Domain.Enums;

namespace PsicoFlow.Api.DTOs;

public class ConsultationResponse
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid PsicologoId { get; set; }
    public string PsicologoName { get; set; } = string.Empty;
    public Guid? SpecialityId { get; set; }
    public string? SpecialityName { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public ConsultationStatus Status { get; set; }
    public ConsultationType Type { get; set; }
    public string? Location { get; set; }
    public string? Observation { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateConsultationRequest
{
    [Required(ErrorMessage = "Paciente é obrigatório")]
    public Guid PatientId { get; set; }

    public Guid? SpecialityId { get; set; }

    [Required(ErrorMessage = "Data/hora de início é obrigatória")]
    public DateTime StartAt { get; set; }

    [Required(ErrorMessage = "Data/hora de fim é obrigatória")]
    public DateTime EndAt { get; set; }

    public ConsultationType Type { get; set; } = ConsultationType.Presencial;
    public string? Location { get; set; }
    public string? Observation { get; set; }
}

public class UpdateConsultationRequest
{
    public Guid? PatientId { get; set; }
    public Guid? SpecialityId { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public ConsultationType? Type { get; set; }
    public string? Location { get; set; }
    public string? Observation { get; set; }
}

public class UpdateConsultationStatusRequest
{
    [Required(ErrorMessage = "Status é obrigatório")]
    public ConsultationStatus Status { get; set; }
}
