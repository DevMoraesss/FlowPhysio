"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, ClipboardList, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function NewEvolutionPage() {
    const router = useRouter();
    const { id } = useParams(); // id do paciente
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Agendamentos concluídos disponíveis para registrar evolução
    const [availableAppointments, setAvailableAppointments] = useState<any[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);

    const [formData, setFormData] = useState({
        appointmentId: "",
        proceduresPerformed: "",
        techniquesApplied: "",
        painScale: 0,
        clinicalNotes: "",
        nextSessionPlan: "",
    });

    useEffect(() => {
        async function loadData() {
            try {
                // Busca agendamentos e evoluções do paciente ao mesmo tempo
                const [appointments, evolutions] = await Promise.all([
                    apiFetch(`/appointments/patient/${id}`),
                    apiFetch(`/evolutions/patient/${id}`),
                ]);

                // Pega os IDs de agendamentos que já têm evolução
                const usedAppointmentIds = new Set(
                    evolutions.map((evo: any) => evo.appointmentId)
                );

                // Filtra: só concluídos (status === 2) e sem evolução ainda
                const available = appointments.filter(
                    (appt: any) =>
                        appt.status === 2 && !usedAppointmentIds.has(appt.id)
                );

                setAvailableAppointments(available);
            } catch (err: any) {
                setError(err.message || "Erro ao carregar dados");
            } finally {
                setLoadingAppointments(false);
            }
        }
        if (id) loadData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.appointmentId) {
            setError("Selecione uma sessão");
            return;
        }
        setSaving(true);
        setError("");

        try {
            await apiFetch("/evolutions", {
                method: "POST",
                body: JSON.stringify({
                    appointmentId: formData.appointmentId,
                    proceduresPerformed: formData.proceduresPerformed,
                    techniquesApplied: formData.techniquesApplied || null,
                    painScale: formData.painScale,
                    clinicalNotes: formData.clinicalNotes,
                    nextSessionPlan: formData.nextSessionPlan || null,
                }),
            });
            router.push(`/patients/${id}`);
        } catch (err: any) {
            setError(err.message || "Erro ao registrar evolução");
            setSaving(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Formata "2026-03-26T14:00:00Z" → "26/03/2026 às 14:00"
    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("pt-BR", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    if (loadingAppointments) return (
        <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-zinc-950">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <header className="mb-10 flex items-center gap-6">
                    <Link
                        href={`/patients/${id}`}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-sage-200 text-sage-500 hover:bg-sage-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-sage-700 dark:text-white font-serif">Nova Evolução</h1>
                        <p className="text-sage-500 dark:text-zinc-500 mt-1">Registre o progresso clínico da sessão.</p>
                    </div>
                </header>

                {error && (
                    <div className="mx-auto max-w-4xl mb-6 rounded-xl bg-red-500/10 p-4 text-sm font-medium text-red-500 border border-red-500/20">
                        {error}
                    </div>
                )}

                {availableAppointments.length === 0 ? (
                    // Nenhuma sessão disponível
                    <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-sage-200 bg-white p-16 text-center wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <ClipboardList size={48} className="mx-auto mb-4 text-sage-200 dark:text-zinc-700" />
                        <h3 className="text-lg font-bold text-sage-600 dark:text-zinc-300 mb-2">
                            Nenhuma sessão disponível
                        </h3>
                        <p className="text-sage-400 dark:text-zinc-500 max-w-sm mx-auto">
                            Para registrar uma evolução, a sessão precisa estar <strong>Concluída</strong> e ainda não ter evolução registrada.
                        </p>
                        <Link
                            href={`/patients/${id}`}
                            className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-sage-200 px-6 py-3 text-sm font-bold text-sage-500 hover:bg-sage-50 dark:border-zinc-800 transition-all"
                        >
                            <ArrowLeft size={16} />
                            Voltar ao paciente
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8">
                        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                            <div className="mb-8 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                    <ClipboardList size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-sage-700 dark:text-white">Dados da Evolução</h3>
                            </div>

                            <div className="space-y-8">
                                {/* Qual sessão */}
                                <div className="space-y-2">
                                    <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500">
                                        Sessão Realizada
                                    </label>
                                    <select
                                        name="appointmentId"
                                        required
                                        value={formData.appointmentId}
                                        onChange={handleChange}
                                        className="w-full rounded-[1.25rem] border border-sage-200 bg-[#fdfdfc] px-4 py-4 text-sm outline-none focus:border-brand-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all"
                                    >
                                        <option value="">Selecione a sessão...</option>
                                        {availableAppointments.map((appt: any) => (
                                            <option key={appt.id} value={appt.id}>
                                                {formatDateTime(appt.startDateTime)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Procedimentos */}
                                <div className="space-y-2">
                                    <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500">
                                        Procedimentos Realizados *
                                    </label>
                                    <textarea
                                        name="proceduresPerformed"
                                        required
                                        rows={3}
                                        value={formData.proceduresPerformed}
                                        onChange={handleChange}
                                        placeholder="Ex: Mobilização articular de joelho, exercícios de fortalecimento de quadríceps..."
                                        className="w-full rounded-[1.25rem] border border-sage-200 bg-[#fdfdfc] px-4 py-4 text-sm outline-none focus:border-brand-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all resize-none"
                                    />
                                </div>

                                {/* Técnicas */}
                                <div className="space-y-2">
                                    <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500">
                                        Técnicas Aplicadas
                                    </label>
                                    <textarea
                                        name="techniquesApplied"
                                        rows={2}
                                        value={formData.techniquesApplied}
                                        onChange={handleChange}
                                        placeholder="Ex: TENS, ultrassom terapêutico, crioterapia..."
                                        className="w-full rounded-[1.25rem] border border-sage-200 bg-[#fdfdfc] px-4 py-4 text-sm outline-none focus:border-brand-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all resize-none"
                                    />
                                </div>

                                {/* Escala de dor EVA */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500">
                                            Escala de Dor (EVA)
                                        </label>
                                        <span className={`rounded-full px-4 py-1 text-sm font-bold ${
                                            Number(formData.painScale) <= 3
                                                ? "bg-green-100 text-green-600"
                                                : Number(formData.painScale) <= 6
                                                ? "bg-amber-100 text-amber-600"
                                                : "bg-red-100 text-red-500"
                                        }`}>
                                            {formData.painScale}/10
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        name="painScale"
                                        min={0}
                                        max={10}
                                        value={formData.painScale}
                                        onChange={handleChange}
                                        className="w-full accent-brand-primary"
                                    />
                                    <div className="flex justify-between text-xs text-sage-400">
                                        <span>Sem dor</span>
                                        <span>Dor moderada</span>
                                        <span>Dor intensa</span>
                                    </div>
                                </div>

                                {/* Anotações clínicas */}
                                <div className="space-y-2">
                                    <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500">
                                        Anotações Clínicas *
                                    </label>
                                    <textarea
                                        name="clinicalNotes"
                                        required
                                        rows={4}
                                        value={formData.clinicalNotes}
                                        onChange={handleChange}
                                        placeholder="Evolução do quadro clínico, resposta ao tratamento, observações relevantes..."
                                        className="w-full rounded-[1.25rem] border border-sage-200 bg-[#fdfdfc] px-4 py-4 text-sm outline-none focus:border-brand-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all resize-none"
                                    />
                                </div>

                                {/* Plano próxima sessão */}
                                <div className="space-y-2">
                                    <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500">
                                        Plano para Próxima Sessão
                                    </label>
                                    <textarea
                                        name="nextSessionPlan"
                                        rows={2}
                                        value={formData.nextSessionPlan}
                                        onChange={handleChange}
                                        placeholder="O que será feito na próxima sessão..."
                                        className="w-full rounded-[1.25rem] border border-sage-200 bg-[#fdfdfc] px-4 py-4 text-sm outline-none focus:border-brand-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </section>

                        <footer className="flex justify-end gap-4">
                            <Link
                                href={`/patients/${id}`}
                                className="px-8 py-4 text-sm font-bold text-sage-500 hover:text-sage-700 transition-colors"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 rounded-2xl bg-brand-primary px-10 py-4 font-bold text-white shadow-xl shadow-brand-primary/20 transition-all hover:bg-brand-secondary hover:translate-y-[-2px] disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                Salvar Evolução
                            </button>
                        </footer>
                    </form>
                )}
            </main>
        </div>
    );
}
