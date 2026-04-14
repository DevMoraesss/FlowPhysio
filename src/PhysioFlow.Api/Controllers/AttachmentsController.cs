using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Domain.Interfaces;

namespace PhysioFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttachmentsController : ControllerBase
{
    private readonly IAttachmentRepository _attachmentRepository;
    private readonly IPatientRepository _patientRepository;
    private readonly IWebHostEnvironment _env;

    private static readonly string[] AllowedContentTypes =
        ["image/jpeg", "image/png", "application/pdf"];

    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    public AttachmentsController(
        IAttachmentRepository attachmentRepository,
        IPatientRepository patientRepository,
        IWebHostEnvironment env)
    {
        _attachmentRepository = attachmentRepository;
        _patientRepository = patientRepository;
        _env = env;
    }

    [HttpGet("patient/{patientId:guid}")]
    public async Task<ActionResult<IEnumerable<AttachmentResponse>>> GetByPatient(Guid patientId)
    {
        if (!await IsOwnedByCurrentUser(patientId))
            return NotFound();

        var attachments = await _attachmentRepository.GetAllByPatientAsync(patientId);
        return Ok(attachments.Select(MapToResponse));
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        var attachment = await _attachmentRepository.GetByIdAsync(id);
        if (attachment == null) return NotFound();

    if (!attachment.PatientId.HasValue || !await IsOwnedByCurrentUser(attachment.PatientId.Value))
        return NotFound();


        if (!System.IO.File.Exists(attachment.FilePath))
            return NotFound(new { message = "Arquivo não encontrado no servidor" });

        var bytes = await System.IO.File.ReadAllBytesAsync(attachment.FilePath);
        return File(bytes, attachment.ContentType, attachment.FileName);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<AttachmentResponse>> Upload(
        IFormFile file,
        [FromForm] Guid? patientId,
        [FromForm] Guid? assessmentId,
        [FromForm] Guid? evolutionId)
    {
    if (patientId == null)
        return BadRequest(new { message = "PatientId é obrigatório para enviar arquivos" });

    if (!await IsOwnedByCurrentUser(patientId.Value))
        return NotFound(new { message = "Paciente não encontrado" });


        if (!AllowedContentTypes.Contains(file.ContentType))
            return BadRequest(new { message = "Tipo de arquivo não permitido. Use JPEG, PNG ou PDF." });

        if (file.Length > MaxFileSizeBytes)
            return BadRequest(new { message = "Arquivo muito grande. Máximo permitido: 10MB." });

        var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads",
            patientId?.ToString() ?? "geral");

        Directory.CreateDirectory(uploadsDir);

        var uniqueName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsDir, uniqueName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var attachment = new Attachment
        {
            PatientId = patientId,
            AssessmentId = assessmentId,
            EvolutionId = evolutionId,
            FileName = file.FileName,
            FilePath = filePath,
            ContentType = file.ContentType,
            FileSize = file.Length
        };

        await _attachmentRepository.AddAsync(attachment);
        return Ok(MapToResponse(attachment));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var attachment = await _attachmentRepository.GetByIdAsync(id);
        if (attachment == null) return NotFound();

        if (!attachment.PatientId.HasValue || !await IsOwnedByCurrentUser(attachment.PatientId.Value))
            return NotFound();

        if (System.IO.File.Exists(attachment.FilePath))
            System.IO.File.Delete(attachment.FilePath);

        await _attachmentRepository.DeleteAsync(id);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!.Value);
    }

    private async Task<bool> IsOwnedByCurrentUser(Guid patientId)
    {
        var patient = await _patientRepository.GetByIdAsync(patientId);
        return patient != null && patient.PhysioId == GetCurrentUserId();
    }

    private static AttachmentResponse MapToResponse(Attachment a) => new()
    {
        Id = a.Id,
        PatientId = a.PatientId,
        AssessmentId = a.AssessmentId,
        EvolutionId = a.EvolutionId,
        FileName = a.FileName,
        ContentType = a.ContentType,
        FileSize = a.FileSize,
        CreatedAt = a.CreatedAt
    };
}
