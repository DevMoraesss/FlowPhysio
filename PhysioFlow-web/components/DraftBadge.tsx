import { AlertCircle } from "lucide-react";

/**
 * Selo de "cadastro incompleto" - o pré-cadastro criado pela agenda.
 *
 * Aparece na lista de pacientes, no prontuário e no card da agenda. O objetivo
 * é a fisioterapeuta nunca se surpreender ao descobrir que não consegue
 * registrar uma avaliação: ela vê o estado antes de tentar.
 */
export function DraftBadge({ size = "md" }: { size?: "sm" | "md" }) {
    const isSmall = size === "sm";

    return (
        <span
            title="Cadastro incompleto - pode agendar, mas ainda não pode receber avaliação, evolução ou protocolo"
            className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 ${
                isSmall ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
            }`}
        >
            <AlertCircle size={isSmall ? 11 : 13} />
            Cadastro incompleto
        </span>
    );
}
