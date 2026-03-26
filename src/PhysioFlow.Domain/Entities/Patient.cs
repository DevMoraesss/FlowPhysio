namespace PhysioFlow.Domain.Entities;

public class Patient : BaseEntity
{
    public Guid PhysioId { get; set; }
    public Guid? GuardianId { get; set; }

    public string FullName { get; set; } = string.Empty;
    public DateOnly BirthDate { get; set; }
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

    // Navigation properties
    public User Physio { get; set; } = null!;
    public Guardian? Guardian { get; set; }
    public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<Evolution> Evolutions { get; set; } = new List<Evolution>();
    public ICollection<Protocol> Protocols { get; set; } = new List<Protocol>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
