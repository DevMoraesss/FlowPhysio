"use client";

import { Sidebar } from "@/components/Sidebar";
import { DollarSign, CheckCircle, Loader2, User, History, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const cycleLabel: Record<number, string> = { 1: "Por Sessão", 2: "Quinzenal", 3: "Mensal", 4: "Semanal" };
const methodLabel: Record<number, string> = { 1: "Pix", 2: "Dinheiro", 3: "Cartão" };
const methodColor: Record<number, string> = {
    1: "bg-green-100 text-green-700",
    2: "bg-amber-100 text-amber-700",
    3: "bg-blue-100 text-blue-700",
};

export default function PaymentsPage() {
    const [activeTab, setActiveTab] = useState<"pendentes" | "historico">("pendentes");

    // Pendentes
    const [pending, setPending] = useState<any[]>([]);
    const [loadingPending, setLoadingPending] = useState(true);
    const [paying, setPaying] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<Record<string, string>>({});

    // Histórico
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("all");

    async function loadPending() {
        try {
            const data = await apiFetch("/appointments/pending-payments");
            setPending(data);
        } finally {
            setLoadingPending(false);
        }
    }

    async function loadHistory() {
        setLoadingHistory(true);
        try {
            const data = await apiFetch("/appointments");
            const paid = data
                .filter((a: any) => a.paymentStatus === 2)
                .sort((a: any, b: any) =>
                    new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()
                );
            setHistory(paid);
            setHistoryLoaded(true);
        } finally {
            setLoadingHistory(false);
        }
    }

    useEffect(() => { loadPending(); }, []);

    useEffect(() => {
        if (activeTab === "historico" && !historyLoaded) loadHistory();
    }, [activeTab]);

    const handleBatchPay = async (patientId: string, appointmentIds: string[]) => {
        const method = Number(paymentMethod[patientId] || "1");
        setPaying(patientId);
        try {
            await apiFetch("/appointments/batch-pay", {
                method: "PATCH",
                body: JSON.stringify({ appointmentIds, paymentMethod: method }),
            });
            await loadPending();
        } catch (err: any) {
            alert(err.message || "Erro ao registrar pagamento");
        } finally {
            setPaying(null);
        }
    };

    // Agrupa histórico por mês
    const groupedHistory = history.reduce((acc: Record<string, any[]>, appt: any) => {
        const d = new Date(appt.startDateTime);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(appt);
        return acc;
    }, {});

    const monthKeys = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a));

    const filteredKeys = selectedMonth === "all"
        ? monthKeys
        : monthKeys.filter(k => k === selectedMonth);

    const monthLabel = (key: string) => {
        const [year, month] = key.split("-");
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return `${months[Number(month) - 1]} ${year}`;
    };

    const totalRevenue = history.reduce((sum: number, a: any) => sum + (a.sessionValue || 0), 0);

    const formatDate = (str: string) =>
        new Date(str).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

    const formatTime = (str: string) =>
        new Date(str).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-sage-700 dark:text-white font-serif">Financeiro</h1>
                    <p className="text-sage-500 dark:text-zinc-500 mt-1">Controle de pagamentos e histórico financeiro.</p>
                </header>

                {/* Tabs */}
                <div className="mb-8 flex gap-2 rounded-2xl border border-sage-200 bg-white p-1.5 w-fit wellness-shadow dark:border-zinc-800 dark:bg-zinc-900">
                    <button onClick={() => setActiveTab("pendentes")}
                        className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${activeTab === "pendentes" ? "bg-brand-primary text-white shadow" : "text-sage-500 hover:text-sage-700 dark:text-zinc-400"}`}>
                        Pendentes {pending.length > 0 && <span className="ml-1.5 rounded-full bg-white/20 px-2 text-xs">{pending.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab("historico")}
                        className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${activeTab === "historico" ? "bg-brand-primary text-white shadow" : "text-sage-500 hover:text-sage-700 dark:text-zinc-400"}`}>
                        Histórico
                    </button>
                </div>

                {/* ── ABA PENDENTES ── */}
                {activeTab === "pendentes" && (
                    <>
                        {loadingPending ? (
                            <div className="flex justify-center py-20">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
                            </div>
                        ) : pending.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-brand-soft dark:bg-brand-primary/10 mb-6">
                                    <CheckCircle size={40} className="text-brand-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-sage-700 dark:text-white mb-2">Tudo em dia!</h2>
                                <p className="text-sage-400 dark:text-zinc-500">Nenhum pagamento pendente no momento.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-w-4xl">
                                {pending.map((item: any) => (
                                    <div key={item.patientId} className="rounded-[2rem] border border-sage-200 bg-white p-8 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Link href={`/patients/${item.patientId}`}
                                                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 dark:bg-zinc-800 text-sage-500 hover:bg-brand-soft hover:text-brand-primary transition-all">
                                                        <User size={20} />
                                                    </Link>
                                                    <div>
                                                        <Link href={`/patients/${item.patientId}`}
                                                            className="font-bold text-sage-700 dark:text-white hover:text-brand-primary transition-colors">
                                                            {item.patientName}
                                                        </Link>
                                                        <p className="text-xs text-sage-400 dark:text-zinc-500">
                                                            {cycleLabel[item.paymentCycle] ?? "—"}
                                                            {item.paymentDay ? ` · ${item.paymentDay}` : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-sage-400 mb-0.5">Sessões</p>
                                                        <p className="text-2xl font-bold text-sage-700 dark:text-white">{item.pendingSessions}</p>
                                                    </div>
                                                    <div className="h-10 w-px bg-sage-100 dark:bg-zinc-800" />
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-sage-400 mb-0.5">Total</p>
                                                        <p className="text-2xl font-bold text-brand-primary">
                                                            R$ {Number(item.totalPending).toFixed(2).replace(".", ",")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-3 min-w-[160px]">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-sage-400">Forma</label>
                                                    <select
                                                        value={paymentMethod[item.patientId] || "1"}
                                                        onChange={(e) => setPaymentMethod(prev => ({ ...prev, [item.patientId]: e.target.value }))}
                                                        className="w-full rounded-xl border border-sage-200 bg-sage-50 px-3 py-2 text-sm outline-none focus:border-brand-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
                                                        <option value="1">Pix</option>
                                                        <option value="2">Dinheiro</option>
                                                        <option value="3">Cartão</option>
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => handleBatchPay(item.patientId, item.appointmentIds)}
                                                    disabled={paying === item.patientId}
                                                    className="flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all disabled:opacity-50">
                                                    {paying === item.patientId ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                                                    Marcar Pago
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── ABA HISTÓRICO ── */}
                {activeTab === "historico" && (
                    <>
                        {loadingHistory ? (
                            <div className="flex justify-center py-20">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <History size={48} className="text-sage-200 dark:text-zinc-700 mb-4" />
                                <p className="text-sage-400">Nenhum pagamento registrado ainda.</p>
                            </div>
                        ) : (
                            <div className="max-w-4xl space-y-6">
                                {/* Totalizador + filtro */}
                                <div className="flex items-center justify-between rounded-[2rem] border border-sage-200 bg-white px-8 py-5 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-sage-400">Receita Total Registrada</p>
                                        <p className="text-3xl font-bold text-brand-primary mt-1">
                                            R$ {totalRevenue.toFixed(2).replace(".", ",")}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-sage-400">Filtrar por Mês</label>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="block rounded-xl border border-sage-200 bg-sage-50 px-3 py-2 text-sm outline-none focus:border-brand-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
                                            <option value="all">Todos os meses</option>
                                            {monthKeys.map(k => (
                                                <option key={k} value={k}>{monthLabel(k)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Grupos por mês */}
                                {filteredKeys.map(key => {
                                    const appointments = groupedHistory[key];
                                    const monthTotal = appointments.reduce((s: number, a: any) => s + (a.sessionValue || 0), 0);
                                    return (
                                        <div key={key}>
                                            {/* Header do mês */}
                                            <div className="mb-3 flex items-center justify-between px-2">
                                                <p className="text-sm font-bold text-sage-600 dark:text-zinc-400 uppercase tracking-wider">
                                                    {monthLabel(key)}
                                                </p>
                                                <p className="text-sm font-bold text-brand-primary">
                                                    R$ {monthTotal.toFixed(2).replace(".", ",")}
                                                    <span className="ml-2 text-xs font-normal text-sage-400">({appointments.length} sessões)</span>
                                                </p>
                                            </div>

                                            {/* Lista de agendamentos */}
                                            <div className="rounded-[2rem] border border-sage-200 bg-white overflow-hidden wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                                                {appointments.map((appt: any, idx: number) => (
                                                    <div key={appt.id}
                                                        className={`flex items-center justify-between px-6 py-4 ${idx < appointments.length - 1 ? "border-b border-sage-50 dark:border-zinc-800" : ""}`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10 shrink-0">
                                                                <Clock size={16} />
                                                            </div>
                                                            <div>
                                                                <Link href={`/patients/${appt.patientId}`}
                                                                    className="font-semibold text-sage-700 dark:text-white hover:text-brand-primary transition-colors text-sm">
                                                                    {appt.patientName || "Paciente"}
                                                                </Link>
                                                                <p className="text-xs text-sage-400">
                                                                    {formatDate(appt.startDateTime)} · {formatTime(appt.startDateTime)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            {appt.paymentMethod && (
                                                                <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${methodColor[appt.paymentMethod] ?? "bg-zinc-100 text-zinc-500"}`}>
                                                                    {methodLabel[appt.paymentMethod] ?? "—"}
                                                                </span>
                                                            )}
                                                            <p className="font-bold text-sage-700 dark:text-white min-w-[80px] text-right">
                                                                R$ {Number(appt.sessionValue).toFixed(2).replace(".", ",")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
