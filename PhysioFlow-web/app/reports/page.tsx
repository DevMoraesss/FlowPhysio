"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { apiFetch } from "@/lib/api";
import { formatBRL } from "@/lib/money";
import { CYCLE_LABELS } from "@/lib/paymentDay";

// Fechamento do mês. Substitui a conta que a fisioterapeuta fazia no papel, paciente por
// paciente, no fim de cada mês. As regras do cálculo estão na classe MonthlyReport da API.

type PatientLine = {
    patientId: string;
    patientName: string;
    paymentCycle: number;
    completedSessions: number;
    noShows: number;
    received: number;
    pending: number;
    receiptsNeeded: number;
};

type Report = {
    year: number;
    month: number;
    completedSessions: number;
    noShows: number;
    cancelled: number;
    received: number;
    pending: number;
    receiptsNeeded: number;
    patients: PatientLine[];
    byPaymentMethod: { paymentMethod: number | null; total: number }[];
};

const METHOD_LABELS: Record<number, string> = { 1: "Pix", 2: "Dinheiro", 3: "Cartão" };

const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

// "outubro de 2026", para usar no meio da frase
function monthText(year: number, month: number): string {
    return monthName.format(new Date(year, month - 1, 1));
}

// "Outubro de 2026", para a lista de meses
function monthLabel(year: number, month: number): string {
    const text = monthText(year, month);
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// O cadastro às vezes já traz "CREFITO-3/...", às vezes só o número
function crefitoText(crefito: string): string {
    return /^crefito/i.test(crefito) ? crefito : `CREFITO ${crefito}`;
}

// Os últimos 24 meses, do atual para trás
function lastMonths(): { year: number; month: number }[] {
    const today = new Date();
    return Array.from({ length: 24 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
}

const cell = "px-3 py-2.5";
const num = `${cell} text-right tabular-nums`;

export default function ReportsPage() {
    const months = useMemo(lastMonths, []);
    const [selected, setSelected] = useState(`${months[0].year}-${months[0].month}`);
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [author, setAuthor] = useState({ fullName: "", crefito: "" });

    const [year, month] = selected.split("-").map(Number);
    const label = monthText(year, month);

    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem("physioflow_user") ?? "{}");
            setAuthor({ fullName: user.fullName ?? "", crefito: user.crefito ?? "" });
        } catch {
            setAuthor({ fullName: "", crefito: "" });
        }
    }, []);

    useEffect(() => {
        load(year, month);
    }, [year, month]);

    async function load(y: number, m: number) {
        setLoading(true);
        setError("");
        try {
            setReport(await apiFetch(`/reports/monthly?year=${y}&month=${m}`));
        } catch (err) {
            setReport(null);
            setError(err instanceof Error ? err.message : "Não foi possível montar o fechamento.");
        } finally {
            setLoading(false);
        }
    }

    const empty = report !== null && report.patients.length === 0;

    return (
        <div className="flex min-h-screen bg-fundo print:bg-white">
            <Sidebar />

            <main className="ml-64 flex-1 px-8 py-6 print:ml-0 print:p-0">
                {/* Só no papel: quem, de quando e quando foi gerado */}
                <div className="mb-6 hidden print:block">
                    <p className="text-[17px] font-semibold text-tinta">Fechamento de {label}</p>
                    <p className="text-sm text-tinta-2">
                        {author.fullName}
                        {author.crefito && ` · ${crefitoText(author.crefito)}`}
                        {` · Gerado pelo PhysioFlow em ${new Date().toLocaleDateString("pt-BR")}`}
                    </p>
                </div>

                <header className="mb-6 flex items-start justify-between gap-6 print:hidden">
                    <div>
                        <h1 className="text-[22px] font-semibold text-tinta">Relatórios</h1>
                        <p className="mt-1 text-[15px] text-tinta-2">
                            Fechamento do mês: sessões, faltas e valores por paciente.
                        </p>
                    </div>
                    <button onClick={() => window.print()} disabled={!report || empty}
                        className="rounded-md bg-acao px-4 py-2 text-[15px] font-medium text-white hover:bg-acao-hover disabled:opacity-60">
                        Imprimir ou salvar em PDF
                    </button>
                </header>

                <div className="mb-6 print:hidden">
                    <label htmlFor="month" className="mb-1.5 block text-sm font-medium text-tinta-2">Mês</label>
                    <select id="month" value={selected} onChange={e => setSelected(e.target.value)}
                        className="w-64 rounded-md border border-linha bg-superficie px-3 py-2.5 text-base text-tinta outline-none focus:border-acao">
                        {months.map(m => (
                            <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                                {monthLabel(m.year, m.month)}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <p className="text-[15px] text-tinta-2">Montando o fechamento de {label}...</p>
                ) : error ? (
                    <div className="rounded-md border border-linha bg-superficie p-5">
                        <p role="alert" className="text-[15px] text-erro">{error}</p>
                        <button onClick={() => load(year, month)} className="mt-3 text-[15px] font-medium text-acao hover:underline">
                            Tentar de novo
                        </button>
                    </div>
                ) : report && empty ? (
                    <div className="rounded-md border border-linha bg-superficie p-5">
                        <p className="text-[15px] text-tinta">Nenhuma sessão realizada nem falta em {label}.</p>
                        <p className="mt-1 text-sm text-tinta-2">Escolha outro mês acima.</p>
                    </div>
                ) : report && (
                    <>
                        <dl className="mb-6 flex flex-wrap gap-x-10 gap-y-3 rounded-md border border-linha bg-superficie px-5 py-4">
                            <Counter label="Sessões realizadas" value={String(report.completedSessions)} />
                            <Counter label="Faltas" value={String(report.noShows)} />
                            <Counter label="Canceladas" value={String(report.cancelled)} />
                            <Counter label="Recebido" value={formatBRL(report.received)} />
                            <Counter label="A receber" value={formatBRL(report.pending)} />
                        </dl>

                        <div className="mb-6 overflow-hidden rounded-md border border-linha bg-superficie">
                            <table className="w-full text-left text-[15px]">
                                <thead className="border-b border-linha text-sm text-tinta-2">
                                    <tr>
                                        <th className={`${cell} font-medium`}>Paciente</th>
                                        <th className={`${cell} font-medium`}>Ciclo</th>
                                        <th className={`${num} font-medium`}>Sessões</th>
                                        <th className={`${num} font-medium`}>Faltas</th>
                                        <th className={`${num} font-medium`}>Recebido</th>
                                        <th className={`${num} font-medium`}>A receber</th>
                                        <th className={`${num} font-medium`}>Recibos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.patients.map(p => (
                                        <tr key={p.patientId} className="border-b border-linha break-inside-avoid">
                                            <td className={`${cell} text-tinta`}>{p.patientName}</td>
                                            <td className={`${cell} text-tinta-2`}>{CYCLE_LABELS[p.paymentCycle] ?? "Por sessão"}</td>
                                            <td className={`${num} text-tinta`}>{p.completedSessions}</td>
                                            <td className={`${num} text-tinta`}>{p.noShows}</td>
                                            <td className={`${num} text-tinta`}>{formatBRL(p.received)}</td>
                                            <td className={`${num} ${p.pending > 0 ? "font-medium text-atencao" : "text-tinta"}`}>
                                                {formatBRL(p.pending)}
                                            </td>
                                            <td className={`${num} text-tinta`}>{p.receiptsNeeded}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="font-medium text-tinta">
                                    <tr>
                                        <td className={cell} colSpan={2}>Total</td>
                                        <td className={num}>{report.completedSessions}</td>
                                        <td className={num}>{report.noShows}</td>
                                        <td className={num}>{formatBRL(report.received)}</td>
                                        <td className={num}>{formatBRL(report.pending)}</td>
                                        <td className={num}>{report.receiptsNeeded}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {report.byPaymentMethod.length > 0 && (
                            <section className="mb-6 break-inside-avoid">
                                <h2 className="mb-2 text-[17px] font-semibold text-tinta">Recebido por forma de pagamento</h2>
                                <div className="w-full max-w-md overflow-hidden rounded-md border border-linha bg-superficie">
                                    <table className="w-full text-left text-[15px]">
                                        <tbody>
                                            {report.byPaymentMethod.map(m => (
                                                <tr key={m.paymentMethod ?? "sem-forma"} className="border-b border-linha last:border-b-0">
                                                    <td className={`${cell} text-tinta`}>
                                                        {m.paymentMethod ? METHOD_LABELS[m.paymentMethod] : "Sem forma registrada"}
                                                    </td>
                                                    <td className={`${num} text-tinta`}>{formatBRL(m.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        <p className="max-w-3xl text-[13px] text-tinta-3">
                            Recebido soma as sessões do mês que já estão pagas, mesmo que o pagamento tenha sido feito
                            depois. A receber soma as sessões realizadas que ainda estão pendentes. Faltas e cancelamentos
                            não entram nos valores, e sessão isenta conta como realizada, sem valor.
                        </p>
                    </>
                )}
            </main>
        </div>
    );
}

function Counter({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-sm text-tinta-2">{label}</dt>
            <dd className="text-[22px] font-semibold tabular-nums text-tinta">{value}</dd>
        </div>
    );
}
