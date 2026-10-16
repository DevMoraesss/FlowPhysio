namespace PhysioFlow.Domain.Enums;

/// <summary>
/// Perfil de acesso da conta. Vai dentro do token e decide quais controllers a conta abre.
///
/// Fisioterapeuta usa o sistema clínico, sempre restrita aos próprios pacientes.
/// Administrador só gerencia contas: cria, desativa, reativa e redefine senha. Não abre
/// paciente, agenda nem prontuário de ninguém, pelo princípio da necessidade da LGPD
/// (art. 6º, III): quem gerencia contas não precisa de dado de saúde para isso.
/// </summary>
public enum UserRole
{
    Physiotherapist = 1,
    Administrator = 2
}
