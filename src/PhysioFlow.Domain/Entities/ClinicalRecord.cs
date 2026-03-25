namespace PsicoFlow.Domain.Entities;

public class ClinicalRecord : BaseEntity
{
    public Guid ConsultationId { get; set; }
    public Consultation Consultation { get; set; } = null!;
    
    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    
    public string? Summary { get; set; }
    public string? TherapeuticGoals { get; set; }
    public string? Observations { get; set; }
    
    // Navigation properties
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
