using PhysioFlow.Domain.Enums;

namespace PhysioFlow.Domain.Entities;

public class Patient : BaseEntity
{
    public Guid PhysioId { get; set; }
    public Guid? GuardianId { get; set; }

    public string FullName { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }

    public string? Cpf { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ZipCode { get; set; }
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public bool IsActive { get; set; } = true;
    public PaymentCycle PaymentCycle { get; set; } = PaymentCycle.PerSession;
    // Semântica depende do ciclo: Mensal/Quinzenal = dia do mês (1-31);
    // Semanal = dia da semana (1=segunda ... 7=domingo); Por Sessão = null
    public int? PaymentDay { get; set; }
    public decimal? DefaultSessionValue { get; set; }

    // Padrão é Complete: todo paciente criado pelo cadastro normal já nasce
    // completo. Só o pré-cadastro da agenda nasce como Draft.
    public RegistrationStatus RegistrationStatus { get; set; } = Enums.RegistrationStatus.Complete;


    // Navigation properties
    public User Physio { get; set; } = null!;
    public Guardian? Guardian { get; set; }
    public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<Evolution> Evolutions { get; set; } = new List<Evolution>();
    public ICollection<Protocol> Protocols { get; set; } = new List<Protocol>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();


    /// <summary>
    /// Pré-cadastro: criado pela agenda, ainda sem os dados completos.
    /// </summary>
    public bool IsDraft => RegistrationStatus == Enums.RegistrationStatus.Draft;

    /// <summary>
    /// Se este paciente pode receber documento clínico - avaliação, evolução
    /// ou protocolo. Um pré-cadastro pode ser AGENDADO, mas não pode ter
    /// prontuário: documento clínico exige paciente identificado de verdade,
    /// por exigência ética e legal de guarda de prontuário.
    /// </summary>
    public bool CanReceiveClinicalRecords => !IsDraft;

    /// <summary>
    /// Idade em anos completos, ou null enquanto não houver data de nascimento.
    /// Subtrai 1 quando o aniversário ainda não chegou neste ano.
    /// </summary>
    public int? AgeInYears(DateOnly today)
    {
        if (BirthDate is not { } birth) return null;

        var age = today.Year - birth.Year;
        if (birth.AddYears(age) > today) age--;
        return age;
    }

    /// <summary>
    /// Promove o pré-cadastro a cadastro completo assim que os dados mínimos
    /// existem. Hoje o que falta no pré-cadastro é a data de nascimento -
    /// concentrar essa definição aqui evita que cada controller tenha a sua.
    /// </summary>
    public void CompleteRegistrationIfPossible()
    {
        if (IsDraft && BirthDate.HasValue)
            RegistrationStatus = Enums.RegistrationStatus.Complete;
    }
}
