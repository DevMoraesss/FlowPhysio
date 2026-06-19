using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhysioFlow.Api.DTOs;
using PhysioFlow.Api.Services;
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
    private readonly IStorageService _storage;

    private static readonly string[] AllowedContentTypes =
        ["image/jpeg", "image/png", "application/pdf"];

    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    public AttachmentsController(
        IAttachmentRepository attachmentRepository,
        IPatientRepository patientRepository,
        IStorageService storage)
    {
        _attachmentRepository = attachmentRepository;
        _patientRepository = patientRepository;
        _storage = storage;
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

        var signedUrl = await _storage.GetSignedUrlAsync(attachment.FilePath);
        return Redirect(signedUrl);
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

        if (!await HasValidMagicBytes(file))
            return BadRequest(new { message = "Conteúdo do arquivo não corresponde ao tipo informado." });

        using var stream = file.OpenReadStream();
        var filePath = await _storage.UploadAsync(stream, file.FileName, file.ContentType, patientId.Value);

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

        await _storage.DeleteAsync(attachment.FilePath);
        await _attachmentRepository.DeleteAsync(id);
        return NoContent();
    }

    private static async Task<bool> HasValidMagicBytes(IFormFile file)
    {
        var buffer = new byte[8];
        using var stream = file.OpenReadStream();
        var read = await stream.ReadAsync(buffer, 0, buffer.Length);
        if (read < 4) return false;

        // JPEG: FF D8 FF
        if (buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF) return true;
        // PNG: 89 50 4E 47
        if (buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47) return true;
        // PDF: 25 50 44 46 (%PDF)
        if (buffer[0] == 0x25 && buffer[1] == 0x50 && buffer[2] == 0x44 && buffer[3] == 0x46) return true;

        return false;
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
