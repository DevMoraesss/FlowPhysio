namespace PhysioFlow.Domain.Enums;

/// <summary>
/// Situação do cadastro de um paciente.
///
/// Existe porque a fisioterapeuta precisa agendar no momento do telefonema,
/// quando muitas vezes só tem o nome e o telefone em mãos. Sem isso ela não
/// conseguia agendar, porque criar um paciente exigia data de nascimento - e
/// responsável completo, se fosse menor de idade.
/// </summary>
public enum RegistrationStatus
{
    /// <summary>
    /// Pré-cadastro: só nome e telefone. Pode ser agendado, mas NÃO pode ter
    /// avaliação, evolução ou protocolo - documento clínico exige paciente
    /// identificado de verdade.
    /// </summary>
    Draft = 1,

    /// <summary>
    /// Cadastro completo. Nenhuma restrição.
    /// </summary>
    Complete = 2
}
