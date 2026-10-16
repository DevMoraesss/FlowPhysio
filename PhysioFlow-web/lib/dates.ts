/**
 * Data de hoje no fuso do computador, no formato do <input type="date"> (AAAA-MM-DD).
 *
 * new Date().toISOString() devolve o dia em UTC: depois das 21h em São Paulo ele já é o dia
 * seguinte, e o formulário abria com a data de amanhã.
 */
export function todayLocal(): string {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
}
