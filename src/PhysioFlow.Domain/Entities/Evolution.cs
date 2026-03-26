namespace PhysioFlow.Domain.Entities;

public class Evolution : BaseEntity
{
    public Guid AppointmentId { get; set; }
    public Guid PatientId { get; set; }

    public string ProceduresPerformed { get; set; } = string.Empty;
    public string? TechniquesApplied { get; set; }
    public int? PainScale { get; set; }
    public string ClinicalNotes { get; set; } = string.Empty;
    public string? NextSessionPlan { get; set; }

    // Navigation properties
    public Appointment Appointment { get; set; } = null!;
    public Patient Patient { get; set; } = null!;
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
