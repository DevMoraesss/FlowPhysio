namespace PhysioFlow.Domain.Time;

/// <summary>
/// Data do consultório. O servidor e o banco trabalham em UTC, mas o "hoje" da fisioterapeuta é o
/// dia de São Paulo: às 22h de terça em Campinas já é quarta-feira em UTC.
///
/// Antes desta classe o painel usava DateTime.UtcNow.Date, e depois das 21h mostrava a agenda do
/// dia seguinte.
/// </summary>
public static class ClinicClock
{
    private static readonly TimeZoneInfo Zone = FindZone();

    public static DateOnly Today() => Today(DateTime.UtcNow);

    /// <summary>Dia do consultório num instante dado em UTC. Separado para poder ser testado.</summary>
    public static DateOnly Today(DateTime utcNow) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(utcNow, Zone));

    /// <summary>
    /// Começo e fim, em UTC, de um dia do consultório. É o intervalo usado para filtrar o banco,
    /// que guarda os horários em UTC.
    /// </summary>
    public static (DateTime StartUtc, DateTime EndUtc) DayInUtc(DateOnly day)
    {
        var start = day.ToDateTime(TimeOnly.MinValue);
        return (TimeZoneInfo.ConvertTimeToUtc(start, Zone),
                TimeZoneInfo.ConvertTimeToUtc(start.AddDays(1), Zone));
    }

    private static TimeZoneInfo FindZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        }
        catch (Exception e) when (e is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            // Servidor sem a base de fusos. O Brasil não tem horário de verão desde 2019,
            // então -3h fixo dá o mesmo resultado.
            return TimeZoneInfo.CreateCustomTimeZone("Brasilia", TimeSpan.FromHours(-3), "Brasília", "Brasília");
        }
    }
}
