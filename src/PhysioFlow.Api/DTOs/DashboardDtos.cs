using PhysioFlow.Domain.Enums;

namespace PhysioFlow.Api.DTOs;

public class DashboardResponse
{
    public DateOnly Date { get; set; }
    public int TotalAppointments { get; set; }
    public int Completed { get; set; }
    public int Scheduled { get; set; }
    public int NoShow { get; set; }
    public int Cancelled { get; set; }
    public decimal TotalRevenue { get; set; }
    public IEnumerable<AppointmentResponse> Appointments { get; set; } = new List<AppointmentResponse>();
}
