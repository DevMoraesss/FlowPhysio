using PhysioFlow.Domain.Enums;

namespace PhysioFlow.Domain.Entities;

public class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Cpf { get; set; }
    public string? Crefito { get; set; }
    public UserRole Role { get; set; } = UserRole.Physiotherapist;

    // Conta desativada não entra mais, e o token que ela já tinha deixa de valer.
    // Os dados ficam guardados: prontuário tem prazo legal de guarda.
    public bool IsActive { get; set; } = true;

    // Senha definida pelo administrador é provisória. Enquanto isto for verdadeiro, a conta só
    // consegue trocar a senha: assim quem definiu a provisória não fica sabendo a senha de uso.
    public bool MustChangePassword { get; set; }

    // Navigation properties
    public ICollection<Patient> Patients { get; set; } = new List<Patient>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
