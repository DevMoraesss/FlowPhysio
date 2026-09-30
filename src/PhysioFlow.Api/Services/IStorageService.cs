namespace PhysioFlow.Api.Services;

/// <summary>
/// Onde os anexos dos pacientes ficam guardados.
///
/// O AttachmentsController depende desta interface e nunca de um provedor
/// concreto. Por causa disso, trocar o lugar de armazenamento é escrever uma
/// classe nova e mudar uma linha no Program.cs, sem tocar em controller,
/// repositório ou banco. Hoje existem duas implementações:
/// <see cref="PostgresStorageService"/> e <see cref="SupabaseStorageService"/>,
/// escolhidas pela configuração "Storage:Provider".
/// </summary>
public interface IStorageService
{
    /// <summary>
    /// Grava o arquivo e devolve a referência dele, que é o que o anexo guarda
    /// na coluna FilePath. O formato da referência é assunto interno de cada
    /// implementação: no Supabase é um caminho dentro do bucket, no PostgreSQL
    /// é o identificador da linha. Quem chama apenas guarda e devolve depois.
    /// </summary>
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, Guid patientId);

    /// <summary>
    /// Abre o arquivo para leitura.
    ///
    /// Substituiu um método que devolvia URL assinada e redirecionava o
    /// navegador direto para o provedor. Duas razões: nem todo lugar de
    /// armazenamento sabe assinar URL (o PostgreSQL não sabe), e o download
    /// passando pela API mantém a verificação de dono do paciente valendo em
    /// toda requisição, em vez de liberar um link temporário que funciona para
    /// qualquer pessoa que o tenha.
    ///
    /// Quem chama vira dono do stream e precisa descartá-lo.
    /// </summary>
    Task<Stream> OpenReadAsync(string filePath);

    /// <summary>
    /// Apaga o arquivo. Não falha se ele já não existir, porque o objetivo é
    /// que ele deixe de existir.
    /// </summary>
    Task DeleteAsync(string filePath);
}
