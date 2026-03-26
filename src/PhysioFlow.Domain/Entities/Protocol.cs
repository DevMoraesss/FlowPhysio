namespace PhysioFlow.Domain.Entities;

public class Protocol : BaseEntity
{
    public Guid PatientId { get; set; }

    public string TreatmentName { get; set; } = string.Empty;
    public int CurrentCycle { get; set; } = 1;
    public int TotalCycles { get; set; }
    public int SessionsPerCycle { get; set; }
    public int CompletedSessions { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public Patient Patient { get; set; } = null!;
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
