"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, Activity, Hash, RefreshCw, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function NewProtocolPage() {
    const router = useRouter();
    const { id } = useParams();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        treatmentName: "",
        totalCycles: "1",
        sessionsPerCycle: "10",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            await apiFetch("/protocols", {
                method: "POST",
                body: JSON.stringify({
                    patientId: id,
                    treatmentName: formData.treatmentName,
                    totalCycles: parseInt(formData.totalCycles),
                    sessionsPerCycle: parseInt(formData.sessionsPerCycle),
                }),
            });

            router.push(`/patients/${id}/protocols`);
        } catch (err: any) {
            setError(err.message || "Erro ao criar protocolo");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Preview do protocolo conforme o usuário preenche os campos
    const totalSessions = parseInt(formData.totalCycles || "0") * parseInt(formData.sessionsPerCycle || "0");

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <header className="mb-10 flex items-center gap-6">
                    <Link
                        href={`/patients/${id}/protocols`}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-sage-200 text-sage-500 hover:bg-sage-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-sage-700 dark:text-white">Novo Protocolo</h1>
                        <p className="text-sage-500 dark:text-zinc-500 mt-1">Crie um plano de tratamento para o paciente.</p>
                    </div>
                </header>

                {error && (
                    <div className="mx-auto max-w-2xl mb-6 rounded-xl bg-red-500/10 p-4 text-sm font-medium text-red-500 border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8">
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">

                        {/* Nome do tratamento */}
                        <div className="mb-8 space-y-2">
                            <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-500 dark:text-zinc-500">
                                Nome do Protocolo / Tratamento *
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">
                                    <Activity size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="treatmentName"
                                    required
                                    value={formData.treatmentName}
                                    onChange={handleChange}
                                    placeholder="Ex: Reabilitação Pós-Cirúrgica do Joelho"
                                    className="wellness-input"
                                />
                            </div>
                        </div>

                        {/* Ciclos e sessões lado a lado */}
                        <div className="mb-8 grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-500 dark:text-zinc-500">
                                    Total de Ciclos *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">
                                        <RefreshCw size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        name="totalCycles"
                                        required
                                        min="1"
                                        max="100"
                                        value={formData.totalCycles}
                                        onChange={handleChange}
                                        className="wellness-input"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-500 dark:text-zinc-500">
                                    Sessões por Ciclo *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">
                                        <Hash size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        name="sessionsPerCycle"
                                        required
                                        min="1"
                                        max="100"
                                        value={formData.sessionsPerCycle}
                                        onChange={handleChange}
                                        className="wellness-input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Preview do protocolo — atualiza em tempo real */}
                        {formData.treatmentName && totalSessions > 0 && (
                            <div className="rounded-2xl border border-brand-primary/20 bg-brand-soft p-6 dark:bg-brand-primary/5 dark:border-brand-primary/20">
                                <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">
                                    Resumo do Protocolo
                                </p>
                                <p className="font-bold text-sage-700 dark:text-white">{formData.treatmentName}</p>
                                <p className="mt-1 text-sm text-sage-500 dark:text-zinc-400">
                                    {formData.totalCycles} ciclo(s) × {formData.sessionsPerCycle} sessões
                                    = <strong className="text-brand-primary">{totalSessions} sessões no total</strong>
                                </p>

                                {/* Miniatura visual dos ciclos */}
                                <div className="mt-4 flex gap-2 flex-wrap">
                                    {Array.from({ length: Math.min(parseInt(formData.totalCycles) || 0, 6) }, (_, i) => (
                                        <div key={i} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-sage-600 dark:bg-zinc-900 dark:text-zinc-400 border border-sage-200 dark:border-zinc-800">
                                            Ciclo {i + 1}
                                            <span className="ml-1 text-brand-primary">
                                                ({formData.sessionsPerCycle}×)
                                            </span>
                                        </div>
                                    ))}
                                    {parseInt(formData.totalCycles) > 6 && (
                                        <div className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-sage-400 dark:bg-zinc-900 border border-sage-200 dark:border-zinc-800">
                                            +{parseInt(formData.totalCycles) - 6} mais...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>

                    <footer className="flex justify-end gap-4">
                        <Link href={`/patients/${id}/protocols`} className="px-8 py-4 text-sm font-bold text-sage-500 hover:text-sage-700 transition-colors">
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-2xl bg-brand-primary px-10 py-4 font-bold text-white shadow-xl shadow-brand-primary/20 transition-all hover:bg-brand-secondary hover:translate-y-[-2px] disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Criar Protocolo
                        </button>
                    </footer>
                </form>
            </main>
        </div>
    );
}
