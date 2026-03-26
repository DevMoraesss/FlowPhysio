using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Domain.Enums;
using PhysioFlow.Domain.Interfaces;

namespace PhysioFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IAppointmentRepository _appointmentRepository;

    public DashboardController(IAppointmentRepository appointmentRepository)
    {
        _appointmentRepository = appointmentRepository;
    }
    

    [HttpGet]
    [ProducesResponseType(typeof(DashboardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardResponse>> GetToday()
    {
        var physioId = GetCurrentUserId();
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var appointments = await _appointmentRepository.GetByDateRangeAsync(
            physioId,
            today,
            tomorrow);

        var list = appointments.ToList();

        var response = new DashboardResponse
        {
            Date = DateOnly.FromDateTime(DateTime.UtcNow),
            TotalAppointments = list.Count,
            Completed = list.Count(a => a.Status == AppointmentStatus.Completed),
            Scheduled = list.Count(a => a.Status == AppointmentStatus.Scheduled),
            NoShow = list.Count(a => a.Status == AppointmentStatus.NoShow),
            Cancelled = list.Count(a => a.Status == AppointmentStatus.Cancelled),
            TotalRevenue = list
                .Where(a => a.PaymentStatus == PaymentStatus.Paid)
                .Sum(a => a.SessionValue),
            Appointments = list.Select(a => new AppointmentResponse
            {
                Id = a.Id,
                PatientId = a.PatientId,
                PhysioId = a.PhysioId,
                ProtocolId = a.ProtocolId,
                StartDateTime = a.StartDateTime,
                EndDateTime = a.EndDateTime,
                Status = a.Status,
                PaymentStatus = a.PaymentStatus,
                PaymentMethod = a.PaymentMethod,
                SessionValue = a.SessionValue,
                RequiresReceipt = a.RequiresReceipt,
                Notes = a.Notes,
                CreatedAt = a.CreatedAt
            })
        };

        return Ok(response);
    }
        private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }
}

