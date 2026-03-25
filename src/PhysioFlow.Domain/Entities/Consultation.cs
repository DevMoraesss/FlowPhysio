using PsicoFlow.Domain.Enums;

namespace PsicoFlow.Domain.Entities;

public class Consultation : BaseEntity
{
    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    
    public Guid PsicologoId { get; set; }
    public User Psicologo { get; set; } = null!;
    
    public Guid? SpecialityId { get; set; }
    public Speciality? Speciality { get; set; }
    
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public ConsultationStatus Status { get; set; } = ConsultationStatus.Agendada;
    public ConsultationType Type { get; set; } = ConsultationType.Presencial;
    public string? Location { get; set; }
    public string? Observation { get; set; }
    
    // Navigation properties
    public ClinicalRecord? ClinicalRecord { get; set; }
}
