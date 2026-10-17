using PhysioFlow.Domain.Reports;

namespace PhysioFlow.Api.DTOs;

public class MonthlyReportResponse
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int CompletedSessions { get; set; }
    public int NoShows { get; set; }
    public int Cancelled { get; set; }
    public decimal Received { get; set; }
    public decimal Pending { get; set; }
    public int ReceiptsNeeded { get; set; }
    public List<MonthlyReportPatientResponse> Patients { get; set; } = new();
    public List<MonthlyReportMethodResponse> ByPaymentMethod { get; set; } = new();

    public static MonthlyReportResponse From(int year, int month, MonthlyReport report) => new()
    {
        Year = year,
        Month = month,
        CompletedSessions = report.CompletedSessions,
        NoShows = report.NoShows,
        Cancelled = report.Cancelled,
        Received = report.Received,
        Pending = report.Pending,
        ReceiptsNeeded = report.ReceiptsNeeded,
        Patients = report.Patients.Select(p => new MonthlyReportPatientResponse
        {
            PatientId = p.PatientId,
            PatientName = p.PatientName,
            PaymentCycle = (int)p.PaymentCycle,
            CompletedSessions = p.CompletedSessions,
            NoShows = p.NoShows,
            Received = p.Received,
            Pending = p.Pending,
            ReceiptsNeeded = p.ReceiptsNeeded
        }).ToList(),
        ByPaymentMethod = report.ByPaymentMethod.Select(m => new MonthlyReportMethodResponse
        {
            // 1 Pix, 2 Dinheiro, 3 Cartão; nulo quando a sessão foi paga sem a forma registrada
            PaymentMethod = m.Method.HasValue ? (int)m.Method.Value : null,
            Total = m.Total
        }).ToList()
    };
}

public class MonthlyReportPatientResponse
{
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public int PaymentCycle { get; set; }
    public int CompletedSessions { get; set; }
    public int NoShows { get; set; }
    public decimal Received { get; set; }
    public decimal Pending { get; set; }
    public int ReceiptsNeeded { get; set; }
}

public class MonthlyReportMethodResponse
{
    public int? PaymentMethod { get; set; }
    public decimal Total { get; set; }
}
