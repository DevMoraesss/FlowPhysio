using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Domain.Enums;
using PhysioFlow.Domain.Interfaces;
using PhysioFlow.Domain.Reports;
using PhysioFlow.Domain.Time;

namespace PhysioFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
// Só o perfil Fisioterapeuta. O administrador recebe 403 aqui: ele gerencia contas, não vê pacientes
[Authorize(Roles = nameof(UserRole.Physiotherapist))]
public class ReportsController : ControllerBase
{
    private readonly IAppointmentRepository _appointmentRepository;

    public ReportsController(IAppointmentRepository appointmentRepository)
    {
        _appointmentRepository = appointmentRepository;
    }

    /// <summary>
    /// Fechamento do mês: sessões, faltas e valores por paciente. As contas ficam na classe
    /// MonthlyReport, no domínio, que tem testes próprios; aqui só se busca o mês certo.
    /// </summary>
    [HttpGet("monthly")]
    [ProducesResponseType(typeof(MonthlyReportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MonthlyReportResponse>> GetMonthly([FromQuery] int year, [FromQuery] int month)
    {
        if (month is < 1 or > 12 || year is < 2000 or > 2100)
            return BadRequest(new { message = "Mês inválido" });

        // O mês é o de São Paulo, não o de UTC: uma sessão às 22h do dia 31 ainda é deste mês
        var (startUtc, endUtc) = ClinicClock.MonthInUtc(year, month);

        // A busca por intervalo pega também sessão que só encosta no mês. O fechamento conta
        // pela hora de início, então filtra de novo aqui.
        var appointments = (await _appointmentRepository.GetByDateRangeAsync(GetCurrentUserId(), startUtc, endUtc))
            .Where(a => a.StartDateTime >= startUtc && a.StartDateTime < endUtc);

        return Ok(MonthlyReportResponse.From(year, month, MonthlyReport.Build(appointments)));
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }
}
