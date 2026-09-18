namespace PhysioFlow.Domain.Validation;

/// <summary>
/// Regras de CPF do sistema, num lugar só.
///
/// Antes desta classe, cada controller tratava CPF de um jeito: o de paciente
/// limpava a máscara, o de responsável e o de usuário gravavam o texto cru. O
/// resultado era que o índice único do banco não funcionava — "123.456.789-00"
/// e "12345678900" são textos diferentes para o PostgreSQL, então a mesma
/// pessoa podia ser cadastrada duas vezes.
///
/// Regra do sistema: CPF é SEMPRE armazenado apenas com dígitos.
/// A máscara é responsabilidade da tela, nunca do banco.
/// </summary>
public static class Cpf
{
    private const int Length = 11;

    /// <summary>
    /// Remove tudo que não for dígito. Devolve null quando não sobra nada,
    /// para que "campo não preenchido" seja sempre null no banco — e não
    /// uma string vazia, que o índice único trataria como um valor real.
    /// </summary>
    public static string? Normalize(string? cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf)) return null;

        var digits = new string(cpf.Where(char.IsDigit).ToArray());
        return digits.Length == 0 ? null : digits;
    }

    /// <summary>
    /// Valida o CPF pelo algoritmo oficial dos dígitos verificadores.
    /// Aceita com ou sem máscara. Null/vazio é considerado válido porque
    /// CPF é opcional no cadastro — quem exige preenchimento é o controller.
    /// </summary>
    public static bool IsValid(string? cpf)
    {
        var digits = Normalize(cpf);
        if (digits == null) return true;      // não informado ≠ inválido
        if (digits.Length != Length) return false;

        // 111.111.111-11, 000.000.000-00 etc. passam na conta dos dígitos
        // verificadores, então precisam ser barrados à parte.
        if (digits.All(d => d == digits[0])) return false;

        // O 10º dígito confere os 9 primeiros; o 11º confere os 10 primeiros.
        return CheckDigit(digits, 9) == digits[9]
            && CheckDigit(digits, 10) == digits[10];
    }

    /// <summary>
    /// Calcula um dígito verificador: multiplica cada dígito por um peso
    /// decrescente, soma tudo, e tira o resto da divisão por 11.
    /// </summary>
    private static char CheckDigit(string digits, int count)
    {
        var sum = 0;
        var weight = count + 1;

        for (var i = 0; i < count; i++)
        {
            sum += (digits[i] - '0') * weight;
            weight--;
        }

        var remainder = sum % Length;
        var digit = remainder < 2 ? 0 : Length - remainder;

        return (char)('0' + digit);
    }
}
