"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, Plus, CheckCircle, XCircle, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Dialog } from "@/components/Dialog";

    type DialogState = {
        title: string;
        message: string;
        confirmLabel?: string;
        variant?: "danger" | "warning" | "default";
        onConfirm: () => void;
        onCancel?: () => void;
    } | null;

export default function ProtocolsPage() {
    const { id } = useParams(); // id do paciente
    const [protocols, setProtocols] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState<string | null>(null); // id do protocolo sendo atualizado

    // e junto com os outros useState:
    const [dialog, setDialog] = useState<DialogState>(null);


    useEffect(() => {
        loadProtocols();
    }, [id]);

    async function loadProtocols() {
        try {
            const data = await apiFetch(`/protocols/patient/${id}`);
            setProtocols(data);
        } catch (err) {
            console.error("Erro ao carregar protocolos:", err);
        } finally {
            setLoading(false);
        }
    }

    // Chama POST /protocols/{id}/complete-session
    // Esse endpoint não precisa de body — só o ID na URL
    async function completeSession(protocolId: string) {
        setCompleting(protocolId);
        try {
            const updated = await apiFetch(`/protocols/${protocolId}/complete-session`, {
                method: "POST",
            });
            // Atualiza o protocolo localmente com os dados retornados
            setProtocols(prev =>
                prev.map(p => p.id === protocolId ? updated : p)
            );
        } catch (err: any) {
            setDialog({
                title: "Erro",
                message: err.message || "Erro ao completar sessão",
                confirmLabel: "OK",
                onConfirm: () => setDialog(null),
            });
        } finally {
            setCompleting(null);
        }
    }

    // Encerra o protocolo manualmente
    function deactivateProtocol(protocolId: string) {
        setDialog({
            title: "Encerrar protocolo",
            message: "O protocolo será encerrado. O progresso atual será mantido no histórico.",
            confirmLabel: "Encerrar",
            variant: "warning",
            onConfirm: async () => {
                setDialog(null);
                try {
                    const updated = await apiFetch(`/protocols/${protocolId}`, {
                        method: "PUT",
                        body: JSON.stringify({ isActive: false }),
                    });
                    setProtocols(prev =>
                        prev.map(p => p.id === protocolId ? updated : p)
                    );
                } catch (err: any) {
                    setDialog({
                        title: "Erro",
                        message: err.message || "Erro ao encerrar protocolo",
                        confirmLabel: "OK",
                        onConfirm: () => setDialog(null),
                    });
                }
            },
            onCancel: () => setDialog(null),
        });
    }


    // Calcula o progresso total do protocolo em %
    // Ex: ciclo 2 de 3, 4 sessões de 10 = (10 + 4) / 30 = 46%
    const totalProgress = (protocol: any) => {
        const totalSessions = protocol.totalCycles * protocol.sessionsPerCycle;
        const doneSessions = (protocol.currentCycle - 1) * protocol.sessionsPerCycle + protocol.completedSessions;
        return Math.round((doneSessions / totalSessions) * 100);
    };

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <header className="mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href={`/patients/${id}`}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-sage-200 text-sage-500 hover:bg-sage-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-sage-700 dark:text-white">Protocolos</h1>
                            <p className="text-sage-500 dark:text-zinc-500 mt-1">Planos de tratamento estruturados em ciclos e sessões.</p>
                        </div>
                    </div>
                    <Link
                        href={`/patients/${id}/protocols/new`}
                        className="flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-3 font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-secondary hover:translate-y-[-2px]"
                    >
                        <Plus size={20} />
                        Novo Protocolo
                    </Link>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
                    </div>
                ) : protocols.length === 0 ? (
                    <div className="rounded-[2rem] border border-sage-200 bg-white p-16 text-center dark:border-zinc-900 dark:bg-zinc-900/40">
                        <Activity size={48} className="mx-auto mb-4 text-sage-200 dark:text-zinc-700" />
                        <p className="text-sage-400">Nenhum protocolo criado ainda.</p>
                        <Link
                            href={`/patients/${id}/protocols/new`}
                            className="mt-4 inline-block text-sm font-bold text-brand-primary hover:underline"
                        >
                            Criar primeiro protocolo
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {protocols.map((protocol: any) => {
                            const progress = totalProgress(protocol);
                            const isCompleting = completing === protocol.id;

                            return (
                                <div key={protocol.id} className="rounded-[2.5rem] border border-sage-200 bg-white p-8 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                                    {/* Header do protocolo */}
                                    <div className="mb-6 flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold text-sage-700 dark:text-white">
                                                    {protocol.treatmentName}
                                                </h3>
                                                {/* Badge de status */}
                                                {protocol.isActive ? (
                                                    <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-primary">
                                                        Ativo
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-sage-500 dark:bg-zinc-800 dark:text-zinc-400">
                                                        Encerrado
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-sage-400 dark:text-zinc-500">
                                                Ciclo {protocol.currentCycle} de {protocol.totalCycles} ·{" "}
                                                {protocol.sessionsPerCycle} sessões por ciclo
                                            </p>
                                        </div>

                                        {/* Botões de ação — só para protocolos ativos */}
                                        {protocol.isActive && (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => completeSession(protocol.id)}
                                                    disabled={isCompleting}
                                                    className="flex items-center gap-2 rounded-2xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-secondary disabled:opacity-50 transition-all"
                                                >
                                                    {isCompleting
                                                        ? <Loader2 size={16} className="animate-spin" />
                                                        : <CheckCircle size={16} />
                                                    }
                                                    Completar Sessão
                                                </button>
                                                <button
                                                    onClick={() => deactivateProtocol(protocol.id)}
                                                    className="flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10 transition-all"
                                                >
                                                    <XCircle size={16} />
                                                    Encerrar
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Barra de progresso total */}
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-center justify-between text-xs font-bold">
                                            <span className="text-sage-500 dark:text-zinc-400">Progresso total</span>
                                            <span className="text-brand-primary">{progress}%</span>
                                        </div>
                                        <div className="h-3 w-full overflow-hidden rounded-full bg-sage-100 dark:bg-zinc-800">
                                            <div
                                                className="h-full rounded-full bg-brand-primary transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Ciclos visuais */}
                                    <div className="mt-6 flex gap-3 flex-wrap">
                                        {Array.from({ length: protocol.totalCycles }, (_, cycleIdx) => {
                                            const cycleNum = cycleIdx + 1;
                                            const isCurrent = cycleNum === protocol.currentCycle;
                                            const isCompleted = cycleNum < protocol.currentCycle || (!protocol.isActive && cycleNum === protocol.currentCycle);

                                            return (
                                                <div
                                                    key={cycleIdx}
                                                    className={`flex-1 min-w-[120px] rounded-2xl p-4 border transition-all ${
                                                        isCompleted
                                                            ? "bg-brand-soft border-brand-primary/20 dark:bg-brand-primary/10 dark:border-brand-primary/20"
                                                            : isCurrent
                                                                ? "bg-white border-brand-primary/40 shadow-md dark:bg-zinc-800 dark:border-brand-primary/30"
                                                                : "bg-sage-50 border-sage-100 dark:bg-zinc-900 dark:border-zinc-800"
                                                    }`}
                                                >
                                                    <p className={`text-xs font-bold uppercase mb-2 ${
                                                        isCompleted ? "text-brand-primary" :
                                                        isCurrent ? "text-sage-700 dark:text-white" :
                                                        "text-sage-400"
                                                    }`}>
                                                        Ciclo {cycleNum}
                                                        {isCompleted && " ✓"}
                                                        {isCurrent && !isCompleted && " — atual"}
                                                    </p>

                                                    {/* Mini bolinhas representando sessões */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {Array.from({ length: protocol.sessionsPerCycle }, (_, sIdx) => {
                                                            const isDone = isCompleted ||
                                                                (isCurrent && sIdx < protocol.completedSessions);
                                                            return (
                                                                <div
                                                                    key={sIdx}
                                                                    className={`h-2.5 w-2.5 rounded-full ${
                                                                        isDone
                                                                            ? "bg-brand-primary"
                                                                            : "bg-sage-200 dark:bg-zinc-700"
                                                                    }`}
                                                                />
                                                            );
                                                        })}
                                                    </div>

                                                    {isCurrent && !isCompleted && (
                                                        <p className="mt-2 text-xs text-sage-400 dark:text-zinc-500">
                                                            {protocol.completedSessions}/{protocol.sessionsPerCycle} sessões
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
            {dialog && (
                <Dialog
                    isOpen={true}
                    title={dialog.title}
                    message={dialog.message}
                    confirmLabel={dialog.confirmLabel}
                    variant={dialog.variant}
                    onConfirm={dialog.onConfirm}
                    onCancel={dialog.onCancel}
                />
            )}
        </div>
    );
}
