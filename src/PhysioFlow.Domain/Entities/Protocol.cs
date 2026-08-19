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

    /// <summary>
    /// Registra uma sessão concluída, avançando o ciclo quando ele fecha e
    /// encerrando o protocolo ao concluir o último ciclo. Ignora protocolos inativos.
    /// </summary>
    public void RegisterCompletedSession()
    {
        if (!IsActive) return;

        CompletedSessions++;

        if (CompletedSessions >= SessionsPerCycle)
        {
            if (CurrentCycle >= TotalCycles)
            {
                // Último ciclo concluído → encerra o protocolo
                // (CompletedSessions fica em SessionsPerCycle para indicar 100%)
                IsActive = false;
            }
            else
            {
                CurrentCycle++;
                CompletedSessions = 0;
            }
        }
    }

    /// <summary>
    /// Desfaz uma sessão concluída (ex.: agendamento revertido de Concluído para
    /// Cancelado/Falta), recuando o ciclo quando necessário e reativando o
    /// protocolo se ele havia sido encerrado pela última sessão.
    /// </summary>
    public void RevertCompletedSession()
    {
        if (!IsActive)
        {
            // Só reativa se o protocolo terminou naturalmente (última sessão do último ciclo);
            // protocolos desativados manualmente não são alterados.
            if (CurrentCycle == TotalCycles && CompletedSessions >= SessionsPerCycle)
            {
                IsActive = true;
                CompletedSessions--;
            }
            return;
        }

        if (CompletedSessions > 0)
        {
            CompletedSessions--;
        }
        else if (CurrentCycle > 1)
        {
            CurrentCycle--;
            CompletedSessions = SessionsPerCycle - 1;
        }
        // CompletedSessions == 0 no primeiro ciclo: nada a desfazer
    }
}
