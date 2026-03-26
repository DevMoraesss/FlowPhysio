namespace PhysioFlow.Domain.Entities;

public class Attachment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid? PatientId { get; set; }
    public Guid? AssessmentId { get; set; }
    public Guid? EvolutionId { get; set; }

    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }

    // Navigation properties
    public Patient? Patient { get; set; }
    public Assessment? Assessment { get; set; }
    public Evolution? Evolution { get; set; }
}
