using PhysioFlow.Domain.Enums;

namespace PhysioFlow.Domain.Entities;

public class Assessment : BaseEntity
{
    public Guid PatientId { get; set; }

    public AssessmentType Type { get; set; }
    public DateTime AssessmentDate { get; set; }
    public string AnamnesisAnswers { get; set; } = string.Empty;
    public string? GeneralNotes { get; set; }

    // Navigation properties
    public Patient Patient { get; set; } = null!;
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
