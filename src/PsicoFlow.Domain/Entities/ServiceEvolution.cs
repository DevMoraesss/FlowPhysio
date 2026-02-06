using PsicoFlow.Domain.Enums;

namespace PsicoFlow.Domain.Entities;

public class ServiceEvolution : BaseEntity
{
    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    
    public Guid PsicologoId { get; set; }
    public User Psicologo { get; set; } = null!;
    
    public DateTime Date { get; set; }
    public TimeSpan? Duration { get; set; }
    public string? Resume { get; set; }
    public SessionBehavior? BehaviorDuringSession { get; set; }
    public string? Observation { get; set; }
}
