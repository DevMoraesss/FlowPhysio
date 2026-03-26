namespace PhysioFlow.Domain.Entities;

public class Guardian : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string? Cpf { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string ZipCode { get; set; } = string.Empty;
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }

    // Navigation properties
    public ICollection<Patient> Patients { get; set; } = new List<Patient>();
}
