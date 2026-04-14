using System.ComponentModel.DataAnnotations;
using PhysioFlow.Domain.Enums;

namespace PhysioFlow.Api.DTOs;

public class AppointmentResponse
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Guid PhysioId { get; set; }
    public Guid? ProtocolId { get; set; }
    public string? PatientName { get; set; }
    public PaymentCycle? PatientPaymentCycle { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public AppointmentStatus Status { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }
    public decimal SessionValue { get; set; }
    public bool RequiresReceipt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAppointmentRequest
{
    [Required]
    public Guid PatientId { get; set; }

    public Guid? ProtocolId { get; set; }

    [Required]
    public DateTime StartDateTime { get; set; }

    [Required]
    public DateTime EndDateTime { get; set; }

    [Required]
    public decimal SessionValue { get; set; }

    public bool RequiresReceipt { get; set; } = false;
    public string? Notes { get; set; }
}

public class UpdateAppointmentRequest
{
    public DateTime? StartDateTime { get; set; }
    public DateTime? EndDateTime { get; set; }
    public AppointmentStatus? Status { get; set; }
    public PaymentStatus? PaymentStatus { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }
    public decimal? SessionValue { get; set; }
    public bool? RequiresReceipt { get; set; }
    public string? Notes { get; set; }
}

public class PendingPaymentResponse
{
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public int PaymentCycle { get; set; }
    public string? PaymentDay { get; set; }
    public int PendingSessions { get; set; }
    public decimal TotalPending { get; set; }
    public List<Guid> AppointmentIds { get; set; } = new();
}

public class BatchPayRequest
{
    public List<Guid> AppointmentIds { get; set; } = new();
    public int PaymentMethod { get; set; }
}
