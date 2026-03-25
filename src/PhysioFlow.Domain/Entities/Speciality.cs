namespace PsicoFlow.Domain.Entities;

public class Speciality : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    // Navigation properties
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Consultation> Consultations { get; set; } = new List<Consultation>();
}
