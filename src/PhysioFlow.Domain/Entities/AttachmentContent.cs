namespace PhysioFlow.Domain.Entities;

/// <summary>
/// Conteúdo binário de um anexo, guardado em tabela própria.
///
/// Fica separado de <see cref="Attachment"/> de propósito. Listar os anexos de
/// um paciente precisa apenas dos metadados (nome, tipo, tamanho), e é isso que
/// a tela mostra. Se os bytes morassem na mesma tabela, o Entity Framework
/// traria o arquivo inteiro em toda listagem, porque por padrão ele carrega
/// todas as colunas da entidade.
///
/// Separando em duas tabelas, os bytes só saem do banco quando alguém baixa o
/// arquivo de fato.
/// </summary>
public class AttachmentContent
{
    /// <summary>
    /// Gerado aqui e não pelo banco, porque o serviço de armazenamento precisa
    /// devolver a referência do arquivo antes de qualquer gravação acontecer.
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    public byte[] Data { get; set; } = Array.Empty<byte>();
}
