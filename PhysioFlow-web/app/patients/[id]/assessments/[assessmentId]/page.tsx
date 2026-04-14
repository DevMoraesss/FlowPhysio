"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, ClipboardList, FileText, Calendar, User, Activity } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function AssessmentDetailsPage() {
    const { id, assessmentId } = useParams();
    const [assessment, setAssessment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const data = await apiFetch(`/assessments/${assessmentId}`);
                setAssessment(data);
            } catch (err: any) {
                setError(err.message || "Erro ao carregar avaliação");
            } finally {
                setLoading(false);
            }
        }
        if (assessmentId) load();
    }, [assessmentId]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-zinc-950">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        </div>
    );

    if (error || !assessment) return (
        <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-zinc-950">
            <p className="text-red-500">{error || "Avaliação não encontrada"}</p>
        </div>
    );

    // Faz o parse do JSON da anamnese
    let answers: any = {};
    try { answers = JSON.parse(assessment.anamnesisAnswers); } catch {}

    const typeLabel = assessment.type === 1 ? "Avaliação Inicial" : "Reavaliação Trimestral";

    // Mapa de labels legíveis para cada chave do JSON
    const atividadeMap: Record<string, string> = {
        sedentario: "Sedentário",
        leve: "Leve (caminhadas)",
        moderado: "Moderado (3x/semana)",
        intenso: "Intenso (diário)",
    };
    const sonoMap: Record<string, string> = {
        boa: "Boa",
        regular: "Regular",
        ruim: "Ruim (dor interfere no sono)",
    };

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
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-sage-700 dark:text-white font-serif">Anamnese Completa</h1>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                                assessment.type === 1
                                    ? "bg-brand-soft text-brand-secondary dark:bg-brand-primary/10 dark:text-brand-primary"
                                    : "bg-amber-100 text-amber-700"
                            }`}>
                                {typeLabel}
                            </span>
                        </div>
                        <p className="text-sage-500 dark:text-zinc-500 mt-1">
                            Realizada em {formatDate(assessment.assessmentDate)}
                        </p>
                    </div>
                </header>

                <div className="mx-auto max-w-4xl space-y-8">

                    {/* Queixa Principal */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <SectionTitle icon={<ClipboardList size={20} />} title="Queixa Principal" />
                        <p className="text-sage-700 dark:text-zinc-200 leading-relaxed">
                            {answers.queixaPrincipal || <span className="text-sage-400 italic">Não informado</span>}
                        </p>
                    </section>

                    {/* Histórico */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <SectionTitle icon={<FileText size={20} />} title="Histórico da Doença Atual" />
                        <p className="text-sage-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                            {answers.historicoDaDoenca || <span className="text-sage-400 italic">Não informado</span>}
                        </p>
                    </section>

                    {/* Grid de campos */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <SectionTitle icon={<User size={20} />} title="Dados Clínicos" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="Localização da Dor" value={answers.localDaDor} />
                            <Field label="Ocupação" value={answers.ocupacao} />
                            <Field label="Fatores que Pioram" value={answers.fatoresAgravantes} />
                            <Field label="Fatores que Melhoram" value={answers.fatoresMelhora} />
                            <Field label="Atividade Física" value={atividadeMap[answers.atividadeFisica] ?? answers.atividadeFisica} />
                            <Field label="Qualidade do Sono" value={sonoMap[answers.qualidadeDeSono] ?? answers.qualidadeDeSono} />
                            <Field label="Cirurgias Anteriores" value={answers.cirurgiasAnteriores} />
                            <Field label="Medicamentos em Uso" value={answers.medicamentosEmUso} />
                            <Field label="Alergias" value={answers.alergias} />
                            <Field label="Histórico Familiar" value={answers.historicoFamiliar} />
                        </div>
                    </section>

                    {/* Observações Gerais */}
                    {assessment.generalNotes && (
                        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                            <SectionTitle icon={<Activity size={20} />} title="Observações Gerais" />
                            <p className="text-sage-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                {assessment.generalNotes}
                            </p>
                        </section>
                    )}

                </div>
            </main>
        </div>
    );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-sage-700 dark:text-white">{title}</h3>
        </div>
    );
}

function Field({ label, value }: { label: string; value?: string }) {
    return (
        <div className="rounded-2xl bg-sage-50/80 p-4 dark:bg-zinc-900/40">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500">{label}</p>
            <p className="text-sm font-medium text-sage-700 dark:text-zinc-200">
                {value || <span className="italic text-sage-300 dark:text-zinc-600">Não informado</span>}
            </p>
        </div>
    );
}
