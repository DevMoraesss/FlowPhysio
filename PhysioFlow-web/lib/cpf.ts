/**
 * Regras de CPF no frontend.
 *
 * ATENÇÃO — este arquivo é um ESPELHO de src/PhysioFlow.Domain/Validation/Cpf.cs.
 * A mesma regra existe nos dois lados de propósito, e cada lado tem um papel:
 *
 *   - Aqui (navegador): avisar a fisioterapeuta na hora, sem esperar o servidor.
 *     É CONFORTO. Qualquer pessoa pode burlar pelo console do navegador.
 *   - Lá (backend): impedir que dado inválido entre no banco.
 *     É a GARANTIA. Nunca remover de lá.
 *
 * Duplicar regra normalmente é um problema — mas o algoritmo do CPF é padrão
 * público fixo da Receita Federal, que não muda. O risco das duas cópias
 * divergirem é praticamente zero. Se um dia mudar, mude nos dois.
 */

const LENGTH = 11;

/** Só os dígitos. "529.982.247-25" → "52998224725" */
export function normalizeCpf(value: string): string {
    return (value ?? "").replace(/\D/g, "");
}

/**
 * Aplica a máscara enquanto a pessoa digita, de forma progressiva:
 * "529"        → "529"
 * "529982"     → "529.982"
 * "52998224725"→ "529.982.247-25"
 *
 * Corta em 11 dígitos, então não adianta digitar mais.
 */
export function formatCpf(value: string): string {
    const d = normalizeCpf(value).slice(0, LENGTH);

    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Valida pelo algoritmo oficial dos dois dígitos verificadores.
 * Campo vazio é considerado válido: CPF é opcional no cadastro.
 */
export function isValidCpf(value: string): boolean {
    const d = normalizeCpf(value);

    if (d.length === 0) return true;          // não informado ≠ inválido
    if (d.length !== LENGTH) return false;

    // 111.111.111-11 e afins passam na conta dos dígitos verificadores,
    // então precisam ser barrados à parte.
    if (d.split("").every(c => c === d[0])) return false;

    return checkDigit(d, 9) === d[9] && checkDigit(d, 10) === d[10];
}

/**
 * Calcula um dígito verificador: multiplica cada dígito por um peso
 * decrescente, soma tudo, e tira o resto da divisão por 11.
 */
function checkDigit(digits: string, count: number): string {
    let sum = 0;
    let weight = count + 1;

    for (let i = 0; i < count; i++) {
        sum += Number(digits[i]) * weight;
        weight--;
    }

    const remainder = sum % LENGTH;
    return String(remainder < 2 ? 0 : LENGTH - remainder);
}
