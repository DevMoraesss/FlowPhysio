namespace PsicoFlow.Domain.Entities;

public class Attachment : BaseEntity
{
    public Guid ClinicalRecordId { get; set; }
    public ClinicalRecord ClinicalRecord { get; set; } = null!;
    
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long FileSize { get; set; }
}
