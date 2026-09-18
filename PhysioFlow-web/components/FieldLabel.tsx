/**
 * Rótulo de campo com o asterisco de obrigatório em vermelho.
 *
 * As telas continuam passando o rótulo como texto simples ("Nome Completo *").
 * Quem enxerga o asterisco e o pinta é este componente - assim não é preciso
 * repetir marcação de cor em cada um dos campos do sistema, e não há risco de
 * um ficar vermelho e outro preto.
 *
 * O asterisco preto, no meio de um texto cinza, passava despercebido. Em
 * vermelho ele é lido como "este aqui você precisa preencher", que é a
 * convenção que qualquer pessoa já viu em formulário de papel.
 *
 * O `sr-only` existe para leitor de tela: ele anuncia "obrigatório" em vez de
 * ler "asterisco", que não significa nada em voz alta.
 */
export function FieldLabelText({ label }: { label: string }) {
    const trimmed = label.trimEnd();

    if (!trimmed.endsWith("*")) return <>{label}</>;

    return (
        <>
            {trimmed.slice(0, -1).trimEnd()}
            <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            <span className="sr-only">(obrigatório)</span>
        </>
    );
}
