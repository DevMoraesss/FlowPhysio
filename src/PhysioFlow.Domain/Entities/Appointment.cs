using PhysioFlow.Domain.Enums;

namespace PhysioFlow.Domain.Entities;

public class Appointment : BaseEntity
{
    public Guid PatientId { get; set; }
    public Guid PhysioId { get; set; }
    public Guid? ProtocolId { get; set; }

    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public PaymentMethod? PaymentMethod { get; set; }
    public decimal SessionValue { get; set; }
    public bool RequiresReceipt { get; set; } = false;
    public string? Notes { get; set; }

    // Navigation properties
    public Patient Patient { get; set; } = null!;
    public User Physio { get; set; } = null!;
    public Protocol? Protocol { get; set; }
    public Evolution? Evolution { get; set; }
}
