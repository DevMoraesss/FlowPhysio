"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, ClipboardList, FileText, Activity, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Dialog } from "@/components/Dialog";

type DialogState = {
    title: string; message: string; confirmLabel?: string;
    variant?: "danger" | "warning" | "default";
    onConfirm: () => void; onCancel?: () => void;
} | null;

const typeLabel: Record<number, string> = {
    1: "Avaliação Inicial",
    2: "Reavaliação Trimestral",
    3: "Alta Clínica",
};
const modelLabel: Record<string, string> = {
    ortopedico: "Ortopédico",
    "neuro-adulto": "Neuro Adulto",
    "neuro-infantil": "Neuro Infantil",
    respiratorio: "Respiratório",
};

export default function AssessmentDetailsPage() {
    const { id, assessmentId } = useParams();
    const router = useRouter();
    const [assessment, setAssessment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [dialog, setDialog] = useState<DialogState>(null);

    useEffect(() => {
        if (!assessmentId) return;
        apiFetch(`/assessments/${assessmentId}`)
            .then(data => setAssessment(data))
            .catch((err: any) => setError(err.message || "Erro ao carregar"))
            .finally(() => setLoading(false));
    }, [assessmentId]);

    const handleDelete = () => {
        setDialog({
            title: "Excluir avaliação",
            message: "Esta avaliação será removida permanentemente do prontuário.",
            confirmLabel: "Excluir",
            variant: "danger",
            onConfirm: async () => {
                setDialog(null);
                try {
                    await apiFetch(`/assessments/${assessmentId}`, { method: "DELETE" });
                    router.push(`/patients/${id}`);
                } catch (err: any) {
                    setDialog({
                        title: "Erro", message: err.message || "Não foi possível excluir.",
                        confirmLabel: "OK", onConfirm: () => setDialog(null),
                    });
                }
            },
            onCancel: () => setDialog(null),
        });
    };

    const formatDate = (s: string) => new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-zinc-950"><div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" /></div>;
    if (error || !assessment) return <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-zinc-950"><p className="text-red-500">{error || "Não encontrada"}</p></div>;

    let answers: any = {};
    try { answers = JSON.parse(assessment.anamnesisAnswers); } catch {}

    // Detecta modelo: campo explícito OU inferência pelas chaves
    const model: string = answers.modelo || (answers.rolou !== undefined ? "neuro-infantil" : "ortopedico");

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />
            <main className="ml-64 flex-1 p-8">
                <header className="mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href={`/patients/${id}`}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-sage-200 text-sage-500 hover:bg-sage-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all shadow-sm">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-3xl font-bold text-sage-700 dark:text-white font-serif">Anamnese Completa</h1>
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${assessment.type === 1 ? "bg-brand-soft text-brand-secondary dark:bg-brand-primary/10 dark:text-brand-primary" : assessment.type === 3 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                    {typeLabel[assessment.type] ?? "—"}
                                </span>
                                {model && (
                                    <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-sage-500 dark:bg-zinc-800 dark:text-zinc-400">
                                        {modelLabel[model] ?? model}
                                    </span>
                                )}
                            </div>
                            <p className="text-sage-500 dark:text-zinc-500 mt-1">Realizada em {formatDate(assessment.assessmentDate)}</p>
                        </div>
                    </div>
                    <button onClick={handleDelete}
                        className="flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10 transition-all">
                        <Trash2 size={16} />
                        Excluir
                    </button>
                </header>

                <div className="mx-auto max-w-4xl space-y-8">
                    {model === "ortopedico" && <OrtopedicoView answers={answers} />}
                    {model === "neuro-adulto" && <NeuroAdultoView answers={answers} />}
                    {model === "neuro-infantil" && <NeuroInfantilView answers={answers} />}
                    {model === "respiratorio" && <RespiratorioView answers={answers} />}

                    {assessment.generalNotes && (
                        <Sec icon={<Activity size={20} />} title="Observações Gerais">
                            <p className="text-sage-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">{assessment.generalNotes}</p>
                        </Sec>
                    )}
                </div>
            </main>
            {dialog && <Dialog isOpen title={dialog.title} message={dialog.message} confirmLabel={dialog.confirmLabel} variant={dialog.variant} onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />}
        </div>
    );
}

// ─── VIEWS POR MODELO ────────────────────────────────────────────────────────

function OrtopedicoView({ answers }: any) {
    const atv: Record<string, string> = { sedentario: "Sedentário", leve: "Leve", moderado: "Moderado", intenso: "Intenso (diário)" };
    const sono: Record<string, string> = { boa: "Boa", regular: "Regular", ruim: "Ruim (dor interfere)" };
    return (
        <>
            <Sec icon={<ClipboardList size={20} />} title="Queixa Principal">
                <p className="text-sage-700 dark:text-zinc-200">{answers.queixaPrincipal || <Em />}</p>
            </Sec>
            <Sec icon={<FileText size={20} />} title="Histórico da Doença Atual">
                <p className="text-sage-700 dark:text-zinc-200 whitespace-pre-wrap">{answers.historicoDaDoenca || <Em />}</p>
            </Sec>
            {answers.escalaDor !== undefined && (
                <Sec icon={<Activity size={20} />} title="Escala de Dor (EVA)">
                    <div className="flex items-center gap-4">
                        <span className={`rounded-full px-4 py-2 text-lg font-bold ${Number(answers.escalaDor) <= 3 ? "bg-green-100 text-green-600" : Number(answers.escalaDor) <= 6 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-500"}`}>
                            {answers.escalaDor}/10
                        </span>
                        <div className="flex-1 h-3 rounded-full bg-sage-100 dark:bg-zinc-800 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${Number(answers.escalaDor) <= 3 ? "bg-green-400" : Number(answers.escalaDor) <= 6 ? "bg-amber-400" : "bg-red-400"}`}
                                style={{ width: `${Number(answers.escalaDor) * 10}%` }} />
                        </div>
                    </div>
                </Sec>
            )}
            <Sec icon={<FileText size={20} />} title="Dados Clínicos">
                <Grid2>
                    <F label="Localização da Dor" value={answers.localDaDor} />
                    <F label="Ocupação" value={answers.ocupacao} />
                    <F label="Fatores que Pioram" value={answers.fatoresAgravantes} />
                    <F label="Fatores que Melhoram" value={answers.fatoresMelhora} />
                    <F label="Atividade Física" value={atv[answers.atividadeFisica] ?? answers.atividadeFisica} />
                    <F label="Qualidade do Sono" value={sono[answers.qualidadeDeSono] ?? answers.qualidadeDeSono} />
                    <F label="Cirurgias Anteriores" value={answers.cirurgiasAnteriores} />
                    <F label="Medicamentos" value={answers.medicamentosEmUso} />
                    <F label="Alergias" value={answers.alergias} />
                    <F label="Histórico Familiar" value={answers.historicoFamiliar} />
                    <F label="Diagnóstico Médico" value={answers.diagnosticoMedico} />
                    <F label="Médico Responsável" value={answers.medicoResponsavel} />
                </Grid2>
            </Sec>
        </>
    );
}

function NeuroAdultoView({ answers }: any) {
    return (
        <>
            <Sec icon={<ClipboardList size={20} />} title="Queixa Principal">
                <p className="text-sage-700 dark:text-zinc-200">{answers.queixaPrincipal || <Em />}</p>
            </Sec>
            <Sec icon={<FileText size={20} />} title="Identificação Clínica">
                <Grid2>
                    <F label="Diagnóstico Médico" value={answers.diagnosticoMedico} />
                    <F label="Médico Responsável" value={answers.medicoResponsavel} />
                    <F label="Data do Evento" value={answers.dataDoEvento} />
                    <F label="Comorbidades" value={answers.comorbidades} />
                    <F label="Medicamentos" value={answers.medicamentos} />
                </Grid2>
                <div className="mt-4"><F label="Histórico da Doença" value={answers.historicoDaDoenca} /></div>
            </Sec>
            <Sec icon={<Activity size={20} />} title="Avaliação Neurológica">
                <Grid2>
                    <F label="Tônus Muscular" value={answers.tonusMuscular} />
                    <F label="Força MMSS" value={answers.forcaMuscularMMSS} />
                    <F label="Força MMII" value={answers.forcaMuscularMMII} />
                    <F label="Sensibilidade" value={answers.sensibilidade} />
                    <F label="Coordenação" value={answers.coordenacao} />
                    <F label="Equilíbrio Estático" value={answers.equilibrioEstatico} />
                    <F label="Equilíbrio Dinâmico" value={answers.equilibrioDinamico} />
                    <F label="Marcha" value={answers.marcha} />
                </Grid2>
            </Sec>
            <Sec icon={<FileText size={20} />} title="AVDs e Cognição">
                <Grid2>
                    <F label="Alimentação" value={answers.avdAlimentacao} />
                    <F label="Banho" value={answers.avdBanho} />
                    <F label="Vestuário" value={answers.avdVestuario} />
                    <F label="Transferências" value={answers.avdTransferencias} />
                </Grid2>
                <div className="mt-4"><F label="Comunicação / Cognição" value={answers.comunicacaoCognicao} /></div>
            </Sec>
        </>
    );
}

function NeuroInfantilView({ answers }: any) {
    const marcos = [["rolou","Rolou"],["sentouComApoio","Sentou c/ apoio"],["sentouSemApoio","Sentou s/ apoio"],["engatinhou","Engatinhou"],["emPeSemApoio","Em pé s/ apoio"],["andou","Andou"]];
    const fraldaMap: Record<string, string> = { sim: "Sim", nao: "Não", parcial: "Em transição" };
    return (
        <>
            <Sec icon={<ClipboardList size={20} />} title="Queixa Principal">
                <p className="text-sage-700 dark:text-zinc-200">{answers.queixaPrincipal || <Em />}</p>
            </Sec>
            <Sec icon={<FileText size={20} />} title="Identificação Clínica">
                <Grid2>
                    <F label="Diagnóstico Médico" value={answers.diagnosticoMedico} />
                    <F label="Médico Responsável" value={answers.medicoResponsavel} />
                    <F label="Medicamentos" value={answers.medicamentos} />
                    <F label="Data Corrigida" value={answers.dataCorrigida} />
                </Grid2>
            </Sec>
            <Sec icon={<Activity size={20} />} title="Marcos do Desenvolvimento Motor">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {marcos.map(([key, label]) => (
                        <div key={key} className="rounded-2xl bg-sage-50/80 p-4 dark:bg-zinc-900/40">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-sage-400 mb-1">{label}</p>
                            <p className="text-sm font-semibold text-sage-700 dark:text-zinc-200">
                                {answers[key] || <span className="italic text-sage-300 dark:text-zinc-600">N/I</span>}
                            </p>
                        </div>
                    ))}
                </div>
            </Sec>
            <Sec icon={<FileText size={20} />} title="AVDs e Avaliação Motora">
                <Grid2>
                    <F label="Alimentação" value={answers.alimentacao} />
                    <F label="Banho" value={answers.banho} />
                    <F label="Usa Fralda?" value={fraldaMap[answers.fralda] ?? answers.fralda} />
                    <F label="Sono" value={answers.sono} />
                    <F label="Tônus Muscular" value={answers.tonusMuscular} />
                    <F label="Equilíbrio" value={answers.equilibrio} />
                    <F label="Coord. Motora Grossa" value={answers.coordenacaoMotoraGrossa} />
                    <F label="Coord. Motora Fina" value={answers.coordenacaoMotoraFina} />
                </Grid2>
                {answers.habilidades && <div className="mt-4"><F label="Habilidades Motoras" value={answers.habilidades} /></div>}
            </Sec>
        </>
    );
}

function RespiratorioView({ answers }: any) {
    const tabMap: Record<string, string> = { nao: "Não fumante", sim: "Fumante ativo", ex: "Ex-fumante" };
    const o2Map: Record<string, string> = { nao: "Não", sim: "Sim (contínua)", noturna: "Noturna", esforco: "Aos esforços" };
    const tosseMap: Record<string, string> = { ausente: "Ausente", seca: "Seca", produtiva: "Produtiva", "produtiva-purulenta": "Produtiva purulenta" };
    const mrcMap: Record<string, string> = { "0": "0 — Só ao exercício intenso", "1": "1 — Ladeira/passo rápido", "2": "2 — Anda mais devagar", "3": "3 — Para a 100m", "4": "4 — Sem sair de casa" };
    return (
        <>
            <Sec icon={<ClipboardList size={20} />} title="Queixa Principal">
                <p className="text-sage-700 dark:text-zinc-200">{answers.queixaPrincipal || <Em />}</p>
            </Sec>
            <Sec icon={<FileText size={20} />} title="Identificação Clínica">
                <Grid2>
                    <F label="Diagnóstico Médico" value={answers.diagnosticoMedico} />
                    <F label="Médico Responsável" value={answers.medicoResponsavel} />
                    <F label="Medicamentos" value={answers.medicamentos} />
                    <F label="Alergias" value={answers.alergias} />
                    <F label="Tabagismo" value={tabMap[answers.tabagismo] ?? answers.tabagismo} />
                    {answers.tabagismo !== "nao" && <F label="Tempo/Carga Tabágica" value={answers.tempoTabagismo} />}
                    <F label="Oxigenoterapia" value={o2Map[answers.oxigenoterapia] ?? answers.oxigenoterapia} />
                </Grid2>
                {answers.historicoDaDoenca && <div className="mt-4"><F label="Histórico" value={answers.historicoDaDoenca} /></div>}
            </Sec>
            <Sec icon={<Activity size={20} />} title="Avaliação Respiratória">
                <Grid2>
                    <F label="Padrão Respiratório" value={answers.padraoRespiratorio} />
                    <F label="Ausculta Pulmonar" value={answers.auscultaPulmonar} />
                    <F label="Saturação O₂" value={answers.saturacaoO2} />
                    <F label="Frequência Respiratória" value={answers.frequenciaRespiratoria} />
                    <F label="Tosse" value={tosseMap[answers.tosse] ?? answers.tosse} />
                    <F label="Dispneia (MRC)" value={mrcMap[answers.dispneiaMRC] ?? answers.dispneiaMRC} />
                    <F label="Expansibilidade Torácica" value={answers.expansibilidadeToraxica} />
                    <F label="Força Musc. Respiratória" value={answers.forcaMuscularRespiratoria} />
                </Grid2>
                {answers.avdLimitacoes && <div className="mt-4"><F label="AVDs e Limitações" value={answers.avdLimitacoes} /></div>}
            </Sec>
        </>
    );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function Sec({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">{icon}</div>
                <h3 className="text-xl font-bold text-sage-700 dark:text-white">{title}</h3>
            </div>
            {children}
        </section>
    );
}

function Grid2({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function F({ label, value }: { label: string; value?: string }) {
    return (
        <div className="rounded-2xl bg-sage-50/80 p-4 dark:bg-zinc-900/40">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500">{label}</p>
            <p className="text-sm font-medium text-sage-700 dark:text-zinc-200">
                {value || <Em />}
            </p>
        </div>
    );
}

function Em() {
    return <span className="italic text-sage-300 dark:text-zinc-600">Não informado</span>;
}
