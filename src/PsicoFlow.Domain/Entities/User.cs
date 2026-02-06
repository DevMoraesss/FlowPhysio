using PsicoFlow.Domain.Enums;

namespace PsicoFlow.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetExpires { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Cpf { get; set; }
    public string? Rg { get; set; }
    public Role Role { get; set; } = Role.Psicologo;
    
    // Address (owned entity)
    public Address? Address { get; set; }
    
    // Navigation properties
    public ICollection<Patient> Patients { get; set; } = new List<Patient>();
    public ICollection<Consultation> Consultations { get; set; } = new List<Consultation>();
    public ICollection<Speciality> Specialities { get; set; } = new List<Speciality>();
}
