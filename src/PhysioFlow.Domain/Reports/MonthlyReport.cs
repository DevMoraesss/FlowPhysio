using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Enums;

namespace PhysioFlow.Domain.Reports;

/// <summary>
/// Fechamento do mês: o que a fisioterapeuta fazia no papel em cerca de uma hora, somando paciente
/// por paciente. Recebe as sessões do mês e devolve os totais, sem tocar em banco.
///
/// Regras:
/// - Sessão realizada é a concluída. Isenta conta como realizada, mas com valor zero.
/// - Falta e cancelamento não entram no dinheiro.
/// - Recebido é o valor das sessões concluídas do mês que estão pagas. O sistema não guarda o dia
///   do pagamento, então uma sessão de outubro paga em novembro aparece em outubro (regime de
///   competência).
/// - A receber é a mesma regra da tela de Pagamentos: concluída e pendente.
/// </summary>
public class MonthlyReport
{
    public int CompletedSessions { get; private init; }
    public int NoShows { get; private init; }
    public int Cancelled { get; private init; }
    public decimal Received { get; private init; }
    public decimal Pending { get; private init; }
    public int ReceiptsNeeded { get; private init; }

    /// <summary>Um por paciente que teve sessão realizada ou falta no mês, em ordem alfabética.</summary>
    public IReadOnlyList<PatientLine> Patients { get; private init; } = [];

    /// <summary>Recebido por forma de pagamento. Forma nula é sessão paga sem a forma registrada.</summary>
    public IReadOnlyList<PaymentMethodLine> ByPaymentMethod { get; private init; } = [];

    public record PatientLine(
        Guid PatientId,
        string PatientName,
        PaymentCycle PaymentCycle,
        int CompletedSessions,
        int NoShows,
        decimal Received,
        decimal Pending,
        int ReceiptsNeeded);

    public record PaymentMethodLine(PaymentMethod? Method, decimal Total);

    public static MonthlyReport Build(IEnumerable<Appointment> appointments)
    {
        var list = appointments.ToList();
        var completed = list.Where(a => a.Status == AppointmentStatus.Completed).ToList();

        var patients = list
            .Where(a => a.Status is AppointmentStatus.Completed or AppointmentStatus.NoShow)
            .GroupBy(a => a.PatientId)
            .Select(g =>
            {
                var done = g.Where(a => a.Status == AppointmentStatus.Completed).ToList();
                var patient = g.First().Patient;
                return new PatientLine(
                    g.Key,
                    patient?.FullName ?? "-",
                    patient?.PaymentCycle ?? PaymentCycle.PerSession,
                    done.Count,
                    g.Count(a => a.Status == AppointmentStatus.NoShow),
                    SumByPayment(done, PaymentStatus.Paid),
                    SumByPayment(done, PaymentStatus.Pending),
                    done.Count(a => a.RequiresReceipt));
            })
            .OrderBy(p => p.PatientName, StringComparer.CurrentCulture)
            .ToList();

        var byMethod = completed
            .Where(a => a.PaymentStatus == PaymentStatus.Paid)
            .GroupBy(a => a.PaymentMethod)
            .Select(g => new PaymentMethodLine(g.Key, g.Sum(a => a.SessionValue)))
            .OrderBy(m => m.Method ?? (PaymentMethod)int.MaxValue)
            .ToList();

        return new MonthlyReport
        {
            CompletedSessions = completed.Count,
            NoShows = list.Count(a => a.Status == AppointmentStatus.NoShow),
            Cancelled = list.Count(a => a.Status == AppointmentStatus.Cancelled),
            Received = SumByPayment(completed, PaymentStatus.Paid),
            Pending = SumByPayment(completed, PaymentStatus.Pending),
            ReceiptsNeeded = completed.Count(a => a.RequiresReceipt),
            Patients = patients,
            ByPaymentMethod = byMethod
        };
    }

    private static decimal SumByPayment(IEnumerable<Appointment> sessions, PaymentStatus status) =>
        sessions.Where(a => a.PaymentStatus == status).Sum(a => a.SessionValue);
}
