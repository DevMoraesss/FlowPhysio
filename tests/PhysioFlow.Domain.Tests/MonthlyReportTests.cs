using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Enums;
using PhysioFlow.Domain.Reports;
using PhysioFlow.Domain.Time;
using Xunit;

namespace PhysioFlow.Domain.Tests;

/// <summary>
/// Testes do fechamento do mês.
///
/// É dinheiro: um erro aqui não quebra tela nenhuma, só mostra um total errado no papel que a
/// fisioterapeuta entrega ao contador. Por isso cada regra do cálculo tem o seu teste.
/// </summary>
public class MonthlyReportTests
{
    private static readonly Patient Ana = new() { Id = Guid.NewGuid(), FullName = "Ana Souza", PaymentCycle = PaymentCycle.PerSession };
    private static readonly Patient Bruno = new() { Id = Guid.NewGuid(), FullName = "Bruno Lima", PaymentCycle = PaymentCycle.Monthly };

    private static Appointment Sessao(
        Patient paciente,
        AppointmentStatus situacao,
        PaymentStatus pagamento = PaymentStatus.Pending,
        decimal valor = 150m,
        PaymentMethod? forma = null,
        bool recibo = false) => new()
    {
        PatientId = paciente.Id,
        Patient = paciente,
        Status = situacao,
        PaymentStatus = pagamento,
        SessionValue = valor,
        PaymentMethod = forma,
        RequiresReceipt = recibo
    };

    [Fact]
    public void Fechamento_SomaRecebidoEAReceberSoDasSessoesConcluidas()
    {
        var relatorio = MonthlyReport.Build(new[]
        {
            Sessao(Ana, AppointmentStatus.Completed, PaymentStatus.Paid, 150m, PaymentMethod.Pix),
            Sessao(Ana, AppointmentStatus.Completed, PaymentStatus.Pending, 150m),
            Sessao(Bruno, AppointmentStatus.Completed, PaymentStatus.Pending, 200m),
        });

        Assert.Equal(3, relatorio.CompletedSessions);
        Assert.Equal(150m, relatorio.Received);
        Assert.Equal(350m, relatorio.Pending);
    }

    [Fact]
    public void Fechamento_FaltaECancelamentoNaoEntramNoDinheiro()
    {
        // Mesmo marcada como paga por engano, a falta não pode virar receita
        var relatorio = MonthlyReport.Build(new[]
        {
            Sessao(Ana, AppointmentStatus.NoShow, PaymentStatus.Paid, 150m),
            Sessao(Ana, AppointmentStatus.Cancelled, PaymentStatus.Pending, 150m),
            Sessao(Ana, AppointmentStatus.Completed, PaymentStatus.Paid, 150m),
        });

        Assert.Equal(1, relatorio.CompletedSessions);
        Assert.Equal(1, relatorio.NoShows);
        Assert.Equal(1, relatorio.Cancelled);
        Assert.Equal(150m, relatorio.Received);
        Assert.Equal(0m, relatorio.Pending);
    }

    [Fact]
    public void Fechamento_SessaoIsentaContaComoRealizadaMasSemValor()
    {
        var relatorio = MonthlyReport.Build(new[]
        {
            Sessao(Ana, AppointmentStatus.Completed, PaymentStatus.Exempt, 150m),
        });

        Assert.Equal(1, relatorio.CompletedSessions);
        Assert.Equal(0m, relatorio.Received);
        Assert.Equal(0m, relatorio.Pending);
    }

    [Fact]
    public void Fechamento_UmaLinhaPorPaciente_EmOrdemAlfabetica_SemQuemSoTemSessaoAgendada()
    {
        var carla = new Patient { Id = Guid.NewGuid(), FullName = "Carla Dias" };
        var relatorio = MonthlyReport.Build(new[]
        {
            Sessao(Bruno, AppointmentStatus.Completed, PaymentStatus.Pending, 200m),
            Sessao(Ana, AppointmentStatus.Completed, PaymentStatus.Paid, 150m, PaymentMethod.Pix),
            Sessao(Ana, AppointmentStatus.NoShow),
            Sessao(carla, AppointmentStatus.Scheduled),
        });

        Assert.Equal(new[] { "Ana Souza", "Bruno Lima" }, relatorio.Patients.Select(p => p.PatientName));

        var ana = relatorio.Patients[0];
        Assert.Equal(1, ana.CompletedSessions);
        Assert.Equal(1, ana.NoShows);
        Assert.Equal(150m, ana.Received);
        Assert.Equal(PaymentCycle.Monthly, relatorio.Patients[1].PaymentCycle);
    }

    [Fact]
    public void Fechamento_AgrupaRecebidoPorFormaDePagamento()
    {
        var relatorio = MonthlyReport.Build(new[]
        {
            Sessao(Ana, AppointmentStatus.Completed, PaymentStatus.Paid, 150m, PaymentMethod.Pix),
            Sessao(Bruno, AppointmentStatus.Completed, PaymentStatus.Paid, 200m, PaymentMethod.Pix),
            Sessao(Ana, AppointmentStatus.Completed, PaymentStatus.Paid, 150m, PaymentMethod.Card),
            Sessao(Ana, AppointmentStatus.Completed, PaymentStatus.Paid, 100m, null),
        });

        Assert.Equal(350m, relatorio.ByPaymentMethod.Single(m => m.Method == PaymentMethod.Pix).Total);
        Assert.Equal(150m, relatorio.ByPaymentMethod.Single(m => m.Method == PaymentMethod.Card).Total);
        // Paga sem a forma registrada (dado antigo) aparece separada, por último, e não some do total
        Assert.Null(relatorio.ByPaymentMethod.Last().Method);
        Assert.Equal(relatorio.Received, relatorio.ByPaymentMethod.Sum(m => m.Total));
    }

    [Fact]
    public void Fechamento_ContaRecibosSoDasSessoesRealizadas()
    {
        var relatorio = MonthlyReport.Build(new[]
        {
            Sessao(Ana, AppointmentStatus.Completed, PaymentStatus.Paid, recibo: true, forma: PaymentMethod.Pix),
            Sessao(Ana, AppointmentStatus.NoShow, recibo: true),
        });

        Assert.Equal(1, relatorio.ReceiptsNeeded);
        Assert.Equal(1, relatorio.Patients[0].ReceiptsNeeded);
    }

    [Fact]
    public void Fechamento_MesSemSessoes_DevolveZerosEListasVazias()
    {
        var relatorio = MonthlyReport.Build(Array.Empty<Appointment>());

        Assert.Equal(0, relatorio.CompletedSessions);
        Assert.Equal(0m, relatorio.Received);
        Assert.Empty(relatorio.Patients);
        Assert.Empty(relatorio.ByPaymentMethod);
    }

    [Fact]
    public void MesEmUtc_OutubroComecaETerminaAsTresDaManhaUtc()
    {
        var (inicio, fim) = ClinicClock.MonthInUtc(2026, 10);

        Assert.Equal(new DateTime(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc), inicio);
        Assert.Equal(new DateTime(2026, 11, 1, 3, 0, 0, DateTimeKind.Utc), fim);
    }
}
