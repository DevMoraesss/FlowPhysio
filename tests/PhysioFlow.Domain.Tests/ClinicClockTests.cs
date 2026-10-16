using PhysioFlow.Domain.Time;
using Xunit;

namespace PhysioFlow.Domain.Tests;

/// <summary>
/// Testes do dia do consultório.
///
/// O defeito que eles protegem: o painel calculava "hoje" em UTC, e às 21h de São Paulo o UTC
/// já virou o dia. A fisioterapeuta abria o sistema à noite para conferir a agenda e via a de
/// amanhã, sem nenhum aviso de que havia algo errado.
/// </summary>
public class ClinicClockTests
{
    private static DateTime Utc(int dia, int hora, int minuto = 0) =>
        new(2026, 10, dia, hora, minuto, 0, DateTimeKind.Utc);

    [Fact]
    public void Hoje_As2330EmSaoPaulo_ContinuaSendoOMesmoDia()
    {
        // 23h30 de sexta, 16/10, em Campinas = 02h30 de sábado, 17/10, em UTC
        var hoje = ClinicClock.Today(Utc(17, 2, 30));

        Assert.Equal(new DateOnly(2026, 10, 16), hoje);
    }

    [Fact]
    public void Hoje_A0001EmSaoPaulo_JaEhODiaSeguinte()
    {
        // 00h01 de sábado em Campinas = 03h01 de sábado em UTC
        var hoje = ClinicClock.Today(Utc(17, 3, 1));

        Assert.Equal(new DateOnly(2026, 10, 17), hoje);
    }

    [Fact]
    public void DiaEmUtc_ComecaEAcabaAsTresDaManhaUtc()
    {
        var (inicio, fim) = ClinicClock.DayInUtc(new DateOnly(2026, 10, 16));

        Assert.Equal(Utc(16, 3), inicio);
        Assert.Equal(Utc(17, 3), fim);
        Assert.Equal(DateTimeKind.Utc, inicio.Kind);
    }

    // Horários em UTC. O comentário diz o horário correspondente em Campinas.
    [Theory]
    [InlineData(16, 2, 59, false)] // 23h59 de 15/10, véspera
    [InlineData(16, 3, 0, true)]   // 00h00 de 16/10
    [InlineData(16, 23, 30, true)] // 20h30 de 16/10, sessão que sumia do painel à noite
    [InlineData(17, 2, 59, true)]  // 23h59 de 16/10
    [InlineData(17, 3, 0, false)]  // 00h00 de 17/10, já é amanhã
    public void DiaEmUtc_SeparaAsSessoesDoDiaCerto(int dia, int hora, int minuto, bool entraNoDia16)
    {
        var (inicio, fim) = ClinicClock.DayInUtc(new DateOnly(2026, 10, 16));
        var sessao = Utc(dia, hora, minuto);

        Assert.Equal(entraNoDia16, sessao >= inicio && sessao < fim);
    }
}
