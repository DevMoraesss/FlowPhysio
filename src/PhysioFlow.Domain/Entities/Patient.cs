namespace PsicoFlow.Domain.Entities;

public class Patient : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    
    // Responsible (parent/guardian for minors)
    public Guid? ResponsibleId { get; set; }
    public User? Responsible { get; set; }
    
    // Psychologist who treats this patient
    public Guid PsicologoId { get; set; }
    public User Psicologo { get; set; } = null!;
    
    // Navigation properties
    public ICollection<Consultation> Consultations { get; set; } = new List<Consultation>();
    public ICollection<ClinicalRecord> ClinicalRecords { get; set; } = new List<ClinicalRecord>();
    public ICollection<ServiceEvolution> ServiceEvolutions { get; set; } = new List<ServiceEvolution>();
}
