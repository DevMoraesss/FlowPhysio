using Microsoft.EntityFrameworkCore;
using PhysioFlow.Domain.Entities;
using PhysioFlow.Infrastructure.Data;

namespace PhysioFlow.Api.Services;

/// <summary>
/// Guarda os anexos no próprio PostgreSQL, em coluna do tipo bytea.
///
/// Existe porque o armazenamento externo passou a exigir plano pago, e sem ele
/// o requisito de anexar exames ficava sem funcionar. Guardar no banco que o
/// sistema já usa não depende de conta nova, cartão nem serviço de terceiro.
///
/// O preço é conhecido: banco e backup crescem junto com os arquivos, e todo
/// download passa pela memória da API. Para um consultório com uma única
/// profissional, arquivos limitados a 10 MB e poucos exames por paciente, isso
/// não pesa. Para escala maior, o caminho é armazenamento de objetos dedicado,
/// que custa apenas uma classe nova porque o controller depende de
/// <see cref="IStorageService"/> e não desta classe.
/// </summary>
public class PostgresStorageService : IStorageService
{
    private readonly PhysioFlowDbContext _db;

    public PostgresStorageService(PhysioFlowDbContext db)
    {
        _db = db;
    }

    /// <remarks>
    /// fileName, contentType e patientId não são usados aqui porque já ficam
    /// gravados na tabela de anexos. Continuam na assinatura porque outros
    /// provedores precisam deles para montar o caminho do arquivo.
    /// </remarks>
    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, Guid patientId)
    {
        using var buffer = new MemoryStream();
        await fileStream.CopyToAsync(buffer);

        var content = new AttachmentContent { Data = buffer.ToArray() };

        await _db.AttachmentContents.AddAsync(content);
        await _db.SaveChangesAsync();

        return content.Id.ToString();
    }

    public async Task<Stream> OpenReadAsync(string filePath)
    {
        var content = await FindAsync(filePath)
            ?? throw new FileNotFoundException($"Conteúdo do anexo não encontrado: {filePath}");

        // writable: false deixa claro que ninguém deve escrever neste stream.
        // Ele é só o empacotamento dos bytes que vieram do banco.
        return new MemoryStream(content.Data, writable: false);
    }

    public async Task DeleteAsync(string filePath)
    {
        var content = await FindAsync(filePath);
        if (content == null) return;

        _db.AttachmentContents.Remove(content);
        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// A referência guardada em FilePath é o identificador da linha. Se vier
    /// algo que não é um Guid, o arquivo simplesmente não existe aqui, e isso
    /// não é motivo para estourar exceção de formato.
    /// </summary>
    private async Task<AttachmentContent?> FindAsync(string filePath)
    {
        if (!Guid.TryParse(filePath, out var id)) return null;

        return await _db.AttachmentContents.FirstOrDefaultAsync(x => x.Id == id);
    }
}
