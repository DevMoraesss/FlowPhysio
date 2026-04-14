namespace PhysioFlow.Api.DTOs;

public class AttachmentResponse
{
    public Guid Id { get; set; }
    public Guid? PatientId { get; set; }
    public Guid? AssessmentId { get; set; }
    public Guid? EvolutionId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime CreatedAt { get; set; }
}
