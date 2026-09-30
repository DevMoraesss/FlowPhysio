using PhysioFlow.Domain.Entities;
using Xunit;

namespace PhysioFlow.Domain.Tests;

/// <summary>
/// Testes da classe Protocol.
///
/// Protocol foi escolhida como primeira classe testada porque concentra a regra
/// de negócio mais densa do domínio: ela decide sozinha quando um ciclo fecha,
/// quando o próximo começa e quando o tratamento termina. É também a única cujo
/// erro seria silencioso, já que um contador errado não quebra tela nenhuma,
/// apenas informa o progresso errado à profissional.
///
/// Nenhum teste aqui toca banco, HTTP ou API. São objetos em memória, o que faz
/// a suíte inteira rodar em milissegundos e funcionar em qualquer máquina.
/// </summary>
public class ProtocolTests
{
    /// <summary>
    /// Protocolo no estado em que nasce: primeiro ciclo, nenhuma sessão feita.
    /// Os valores padrão reproduzem o caso real relatado pela fisioterapeuta,
    /// a fotobiomodulação em 3 ciclos de 10 sessões.
    /// </summary>
    private static Protocol CriarProtocolo(
        int totalCiclos = 3,
        int sessoesPorCiclo = 10,
        int cicloAtual = 1,
        int sessoesConcluidas = 0,
        bool ativo = true) => new()
        {
            TreatmentName = "Fotobiomodulação - Imunidade",
            TotalCycles = totalCiclos,
            SessionsPerCycle = sessoesPorCiclo,
            CurrentCycle = cicloAtual,
            CompletedSessions = sessoesConcluidas,
            IsActive = ativo
        };

    // ----------------------------------------------------------------
    // RegisterCompletedSession
    // ----------------------------------------------------------------

    [Fact]
    public void RegistrarSessao_NoMeioDoCiclo_ApenasIncrementaContador()
    {
        var protocolo = CriarProtocolo(sessoesConcluidas: 4);

        protocolo.RegisterCompletedSession();

        Assert.Equal(5, protocolo.CompletedSessions);
        Assert.Equal(1, protocolo.CurrentCycle);
        Assert.True(protocolo.IsActive);
    }

    [Fact]
    public void RegistrarSessao_QueFechaCicloNaoFinal_AvancaCicloEZeraContador()
    {
        var protocolo = CriarProtocolo(sessoesConcluidas: 9);

        protocolo.RegisterCompletedSession();

        Assert.Equal(2, protocolo.CurrentCycle);
        Assert.Equal(0, protocolo.CompletedSessions);
        Assert.True(protocolo.IsActive);
    }

    [Fact]
    public void RegistrarSessao_QueFechaUltimoCiclo_EncerraProtocolo()
    {
        var protocolo = CriarProtocolo(cicloAtual: 3, sessoesConcluidas: 9);

        protocolo.RegisterCompletedSession();

        Assert.False(protocolo.IsActive);
        Assert.Equal(3, protocolo.CurrentCycle);

        // O contador fica cheio de propósito, e não zerado: é o que permite a
        // tela mostrar 10 de 10 em vez de 0 de 10 num tratamento concluído.
        Assert.Equal(10, protocolo.CompletedSessions);
    }

    [Fact]
    public void RegistrarSessao_EmProtocoloInativo_NaoAlteraNada()
    {
        var protocolo = CriarProtocolo(cicloAtual: 2, sessoesConcluidas: 3, ativo: false);

        protocolo.RegisterCompletedSession();

        Assert.Equal(3, protocolo.CompletedSessions);
        Assert.Equal(2, protocolo.CurrentCycle);
        Assert.False(protocolo.IsActive);
    }

    [Fact]
    public void RegistrarSessao_EmProtocoloDeCicloUnico_EncerraAoCompletar()
    {
        var protocolo = CriarProtocolo(totalCiclos: 1, sessoesPorCiclo: 5, sessoesConcluidas: 4);

        protocolo.RegisterCompletedSession();

        Assert.False(protocolo.IsActive);
        Assert.Equal(1, protocolo.CurrentCycle);
        Assert.Equal(5, protocolo.CompletedSessions);
    }

    // ----------------------------------------------------------------
    // RevertCompletedSession
    // ----------------------------------------------------------------

    [Fact]
    public void ReverterSessao_NoMeioDoCiclo_ApenasDecrementaContador()
    {
        var protocolo = CriarProtocolo(cicloAtual: 2, sessoesConcluidas: 6);

        protocolo.RevertCompletedSession();

        Assert.Equal(5, protocolo.CompletedSessions);
        Assert.Equal(2, protocolo.CurrentCycle);
    }

    [Fact]
    public void ReverterSessao_NoInicioDeCicloPosterior_VoltaParaOFimDoCicloAnterior()
    {
        var protocolo = CriarProtocolo(cicloAtual: 2, sessoesConcluidas: 0);

        protocolo.RevertCompletedSession();

        Assert.Equal(1, protocolo.CurrentCycle);
        Assert.Equal(9, protocolo.CompletedSessions);
    }

    [Fact]
    public void ReverterSessao_SemNadaParaDesfazer_NaoDeixaContadorNegativo()
    {
        var protocolo = CriarProtocolo(cicloAtual: 1, sessoesConcluidas: 0);

        protocolo.RevertCompletedSession();

        Assert.Equal(0, protocolo.CompletedSessions);
        Assert.Equal(1, protocolo.CurrentCycle);
        Assert.True(protocolo.IsActive);
    }

    [Fact]
    public void ReverterSessao_EmProtocoloEncerradoNaturalmente_ReabreEVoltaUmaSessao()
    {
        // Estado exato em que a última sessão do último ciclo deixa o protocolo.
        var protocolo = CriarProtocolo(cicloAtual: 3, sessoesConcluidas: 10, ativo: false);

        protocolo.RevertCompletedSession();

        Assert.True(protocolo.IsActive);
        Assert.Equal(3, protocolo.CurrentCycle);
        Assert.Equal(9, protocolo.CompletedSessions);
    }

    [Fact]
    public void ReverterSessao_EmProtocoloDesativadoNoMeio_NaoReabre()
    {
        // Desativado pela profissional antes do fim: paciente desistiu, por
        // exemplo. Reverter uma sessão não deve ressuscitar o tratamento.
        var protocolo = CriarProtocolo(cicloAtual: 1, sessoesConcluidas: 5, ativo: false);

        protocolo.RevertCompletedSession();

        Assert.False(protocolo.IsActive);
        Assert.Equal(5, protocolo.CompletedSessions);
        Assert.Equal(1, protocolo.CurrentCycle);
    }

    // ----------------------------------------------------------------
    // Cenários completos
    // ----------------------------------------------------------------

    [Fact]
    public void TratamentoCompleto_TresCiclosDeDezSessoes_EncerraNaTrigesima()
    {
        var protocolo = CriarProtocolo();

        for (var i = 0; i < 30; i++)
            protocolo.RegisterCompletedSession();

        Assert.False(protocolo.IsActive);
        Assert.Equal(3, protocolo.CurrentCycle);
        Assert.Equal(10, protocolo.CompletedSessions);
    }

    [Fact]
    public void TratamentoCompleto_SessaoExtraDepoisDeEncerrado_EIgnorada()
    {
        var protocolo = CriarProtocolo();
        for (var i = 0; i < 30; i++)
            protocolo.RegisterCompletedSession();

        protocolo.RegisterCompletedSession();

        Assert.False(protocolo.IsActive);
        Assert.Equal(3, protocolo.CurrentCycle);
        Assert.Equal(10, protocolo.CompletedSessions);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(9)]
    [InlineData(10)]
    [InlineData(15)]
    [InlineData(25)]
    public void RegistrarEReverterAMesmaQuantidade_VoltaAoEstadoInicial(int quantidade)
    {
        // Propriedade de ida e volta: desfazer tudo o que foi feito precisa
        // devolver o protocolo ao ponto de partida, inclusive quando o caminho
        // passou por viradas de ciclo.
        var protocolo = CriarProtocolo();

        for (var i = 0; i < quantidade; i++)
            protocolo.RegisterCompletedSession();

        for (var i = 0; i < quantidade; i++)
            protocolo.RevertCompletedSession();

        Assert.Equal(1, protocolo.CurrentCycle);
        Assert.Equal(0, protocolo.CompletedSessions);
        Assert.True(protocolo.IsActive);
    }

    [Fact]
    public void ReverterMaisVezesDoQueRegistrou_NaoQuebraOProtocolo()
    {
        var protocolo = CriarProtocolo();

        for (var i = 0; i < 3; i++)
            protocolo.RegisterCompletedSession();

        for (var i = 0; i < 10; i++)
            protocolo.RevertCompletedSession();

        Assert.Equal(1, protocolo.CurrentCycle);
        Assert.Equal(0, protocolo.CompletedSessions);
        Assert.True(protocolo.IsActive);
    }
}
