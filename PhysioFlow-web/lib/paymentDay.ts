// Regras de dia de pagamento, espelhando o backend (PatientsController):
// - Mensal (3) / Quinzenal (2): dia do mês (1-31); quinzenal cobra no dia X e X+15
// - Semanal (4): dia da semana (1=segunda ... 7=domingo)
// - Por Sessão (1): não se aplica (null)

export const WEEKDAY_LABELS: Record<number, string> = {
    1: "segunda", 2: "terça", 3: "quarta", 4: "quinta",
    5: "sexta", 6: "sábado", 7: "domingo",
};

export function formatPaymentDay(cycle: number, day: number | null | undefined): string | null {
    if (!day) return null;
    switch (cycle) {
        case 2: return `Dias ${day} e ${Math.min(day + 15, 31)}`;
        case 3: return `Todo dia ${day}`;
        case 4: {
            const label = WEEKDAY_LABELS[day];
            if (!label) return null;
            return day >= 6 ? `Todo ${label}` : `Toda ${label}`;
        }
        default: return null;
    }
}

// Opções para os selects dos formulários de paciente (valores como string)
export function paymentDayOptions(cycle: string): { value: string; label: string }[] {
    if (cycle === "4")
        return Object.entries(WEEKDAY_LABELS).map(([value, label]) => ({
            value,
            label: label.charAt(0).toUpperCase() + label.slice(1),
        }));
    if (cycle === "2")
        return Array.from({ length: 31 }, (_, i) => ({
            value: String(i + 1),
            label: `Dias ${i + 1} e ${Math.min(i + 16, 31)}`,
        }));
    if (cycle === "3")
        return Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: `Dia ${i + 1}` }));
    return [];
}

export type DueStatus = "overdue" | "today" | "upcoming";
export type DueInfo = { status: DueStatus; days: number; label: string };

const DAY_MS = 86_400_000;

function stripTime(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function lastDayOfMonth(year: number, monthIndex: number): number {
    return new Date(year, monthIndex + 1, 0).getDate();
}

// Dias de vencimento do ciclo em um mês, clampados para meses curtos (dia 31 → último dia)
function dueDaysInMonth(cycle: number, day: number, year: number, monthIndex: number): number[] {
    const last = lastDayOfMonth(year, monthIndex);
    if (cycle === 3) return [Math.min(day, last)];
    if (cycle === 2) return [Math.min(day, last), Math.min(day + 15, last)];
    return [];
}

/**
 * Situação da cobrança de um paciente com pendências.
 * Considera "atrasado" apenas se existe sessão pendente ANTERIOR ao último
 * vencimento (ou seja, deveria ter sido cobrada e não foi); caso contrário,
 * a pendência vence na próxima data do ciclo.
 */
export function getDueInfo(
    cycle: number,
    day: number | null | undefined,
    oldestPendingSession?: string | null,
    now: Date = new Date(),
): DueInfo | null {
    if (!day) return null;
    const today = stripTime(now);

    let lastDue: Date | null = null;
    let nextDue: Date | null = null;

    if (cycle === 4) {
        if (day < 1 || day > 7) return null;
        const jsDow = today.getDay() === 0 ? 7 : today.getDay(); // JS: 0=domingo → 7
        const daysBack = (jsDow - day + 7) % 7;
        lastDue = new Date(today.getTime() - daysBack * DAY_MS);
        nextDue = new Date(lastDue.getTime() + 7 * DAY_MS);
    } else if (cycle === 2 || cycle === 3) {
        const candidates: Date[] = [];
        for (const delta of [-1, 0, 1]) {
            const base = new Date(today.getFullYear(), today.getMonth() + delta, 1);
            for (const d of dueDaysInMonth(cycle, day, base.getFullYear(), base.getMonth()))
                candidates.push(new Date(base.getFullYear(), base.getMonth(), d));
        }
        lastDue = candidates.filter(c => c.getTime() <= today.getTime())
            .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
        nextDue = candidates.filter(c => c.getTime() > today.getTime())
            .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
    } else {
        return null;
    }

    const oldest = oldestPendingSession ? stripTime(new Date(oldestPendingSession)) : null;

    if (lastDue && oldest && oldest.getTime() <= lastDue.getTime()) {
        const days = Math.round((today.getTime() - lastDue.getTime()) / DAY_MS);
        if (days === 0) return { status: "today", days: 0, label: "Vence hoje" };
        return { status: "overdue", days, label: `Atrasado há ${days} dia${days > 1 ? "s" : ""}` };
    }

    if (lastDue && lastDue.getTime() === today.getTime())
        return { status: "today", days: 0, label: "Vence hoje" };

    if (nextDue) {
        const days = Math.round((nextDue.getTime() - today.getTime()) / DAY_MS);
        return { status: "upcoming", days, label: `Vence em ${days} dia${days > 1 ? "s" : ""}` };
    }

    return null;
}
