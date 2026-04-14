"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, ClipboardList, Save, Loader2, Baby, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function NewAssessmentPage() {
    const router = useRouter();
    const { id } = useParams();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [isAdult, setIsAdult] = useState(true);

    const [assessmentType, setAssessmentType] = useState("1");
    const [assessmentDate, setAssessmentDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [generalNotes, setGeneralNotes] = useState("");

    // Respostas para adulto
    const [adultAnswers, setAdultAnswers] = useState({
        queixaPrincipal: "",
        diagnosticoMedico: "",
        medicoResponsavel: "",
        historicoDaDoenca: "",
        localDaDor: "",
        escalaDor: "0",
        fatoresAgravantes: "",
        fatoresMelhora: "",
        cirurgiasAnteriores: "",
        medicamentosEmUso: "",
        alergias: "",
        atividadeFisica: "sedentario",
        ocupacao: "",
        historicoFamiliar: "",
        qualidadeDeSono: "boa",
    });

    // Respostas para pediátrico
    const [pedAnswers, setPedAnswers] = useState({
        queixaPrincipal: "",
        diagnosticoMedico: "",
        medicoResponsavel: "",
        medicamentos: "",
        dataCorrigida: "",
        // Marcos motores
        rolou: "",
        sentouComApoio: "",
        sentouSemApoio: "",
        engatinhou: "",
        emPeSemApoio: "",
        andou: "",
        // AVD
        alimentacao: "",
        banho: "",
        fralda: "sim",
        sono: "",
        // Avaliação motora
        tonusMuscular: "",
        coordenacaoMotoraGrossa: "",
        coordenacaoMotoraFina: "",
        equilibrio: "",
        habilidades: "",
    });

    const handleAdultChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setAdultAnswers((prev) => ({ ...prev, [name]: value }));
    };

    const handlePedChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setPedAnswers((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const answers = isAdult ? adultAnswers : pedAnswers;
            await apiFetch("/assessments", {
                method: "POST",
                body: JSON.stringify({
                    patientId: id,
                    type: Number(assessmentType),
                    assessmentDate: `${assessmentDate}T12:00:00Z`,
                    anamnesisAnswers: JSON.stringify(answers),
                    generalNotes: generalNotes || null,
                }),
            });
            router.push(`/patients/${id}`);
        } catch (err: any) {
            setError(err.message || "Erro ao registrar avaliação");
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <header className="mb-10 flex items-center gap-6">
                    <Link href={`/patients/${id}`}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-sage-200 text-sage-500 hover:bg-sage-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all shadow-sm">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-sage-700 dark:text-white font-serif">Nova Anamnese</h1>
                        <p className="text-sage-500 dark:text-zinc-500 mt-1">Registre a avaliação clínica do paciente.</p>
                    </div>
                </header>

                {error && (
                    <div className="mx-auto max-w-4xl mb-6 rounded-xl bg-red-500/10 p-4 text-sm font-medium text-red-500 border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8">

                    {/* Seção 1: Tipo, data e modo */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                <ClipboardList size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-sage-700 dark:text-white">Identificação da Avaliação</h3>
                        </div>

                        {/* Toggle Adulto / Pediátrico */}
                        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-sage-100 bg-sage-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                            <button type="button" onClick={() => setIsAdult(true)}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${isAdult ? "bg-white shadow text-brand-primary dark:bg-zinc-800" : "text-sage-400"}`}>
                                <User size={16} /> Adulto / Ortopédico
                            </button>
                            <button type="button" onClick={() => setIsAdult(false)}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${!isAdult ? "bg-white shadow text-brand-primary dark:bg-zinc-800" : "text-sage-400"}`}>
                                <Baby size={16} /> Pediátrico / Neuro
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className={labelClass}>Tipo de Avaliação</label>
                                <select value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)} className={selectClass}>
                                    <option value="1">Avaliação Inicial</option>
                                    <option value="2">Reavaliação Trimestral</option>
                                    <option value="3">Alta Clínica</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Data da Avaliação</label>
                                <input type="date" required value={assessmentDate}
                                    onChange={(e) => setAssessmentDate(e.target.value)} className={inputClass} />
                            </div>
                        </div>
                    </section>

                    {/* Formulário dinâmico */}
                    {isAdult ? (
                        <AdultForm answers={adultAnswers} onChange={handleAdultChange} />
                    ) : (
                        <PedForm answers={pedAnswers} onChange={handlePedChange} />
                    )}

                    {/* Observações gerais */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <h3 className="mb-6 text-xl font-bold text-sage-700 dark:text-white">Observações Gerais</h3>
                        <textarea rows={4} value={generalNotes}
                            onChange={(e) => setGeneralNotes(e.target.value)}
                            placeholder="Anotações livres, impressões clínicas, objetivos do tratamento..."
                            className={textareaClass} />
                    </section>

                    <footer className="flex justify-end gap-4">
                        <Link href={`/patients/${id}`} className="px-8 py-4 text-sm font-bold text-sage-500 hover:text-sage-700 transition-colors">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 rounded-2xl bg-brand-primary px-10 py-4 font-bold text-white shadow-xl shadow-brand-primary/20 transition-all hover:bg-brand-secondary hover:translate-y-[-2px] disabled:opacity-50">
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Salvar Avaliação
                        </button>
                    </footer>
                </form>
            </main>
        </div>
    );
}

function AdultForm({ answers, onChange }: any) {
    return (
        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
            <h3 className="mb-8 text-xl font-bold text-sage-700 dark:text-white">Anamnese — Adulto / Ortopédico</h3>
            <div className="space-y-8">
                <Field label="Queixa Principal *">
                    <textarea name="queixaPrincipal" required rows={2} value={answers.queixaPrincipal}
                        onChange={onChange} placeholder="Ex: Dor no joelho direito há 3 semanas..." className={textareaClass} />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field label="Diagnóstico Médico">
                        <input type="text" name="diagnosticoMedico" value={answers.diagnosticoMedico}
                            onChange={onChange} placeholder="Ex: Artrose grau 3, LCA roto..." className={inputClass} />
                    </Field>
                    <Field label="Médico Responsável">
                        <input type="text" name="medicoResponsavel" value={answers.medicoResponsavel}
                            onChange={onChange} placeholder="Ex: Dr. Fernando Mendes" className={inputClass} />
                    </Field>
                </div>

                <Field label="Histórico da Doença Atual">
                    <textarea name="historicoDaDoenca" rows={3} value={answers.historicoDaDoenca}
                        onChange={onChange} placeholder="Como surgiu, evolução, tratamentos anteriores..."
                        className={textareaClass} />
                </Field>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className={labelClass}>Escala de Dor (EVA)</label>
                        <span className={`rounded-full px-4 py-1 text-sm font-bold ${
                            Number(answers.escalaDor) <= 3 ? "bg-green-100 text-green-600"
                            : Number(answers.escalaDor) <= 6 ? "bg-amber-100 text-amber-600"
                            : "bg-red-100 text-red-500"}`}>
                            {answers.escalaDor}/10
                        </span>
                    </div>
                    <input type="range" name="escalaDor" min={0} max={10}
                        value={answers.escalaDor} onChange={onChange} className="w-full accent-brand-primary" />
                    <div className="flex justify-between text-xs text-sage-400">
                        <span>Sem dor</span><span>Dor moderada</span><span>Dor intensa</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field label="Localização da Dor">
                        <input type="text" name="localDaDor" value={answers.localDaDor}
                            onChange={onChange} placeholder="Ex: Joelho direito, lombar..." className={inputClass} />
                    </Field>
                    <Field label="Ocupação">
                        <input type="text" name="ocupacao" value={answers.ocupacao}
                            onChange={onChange} placeholder="Ex: Professora, motorista..." className={inputClass} />
                    </Field>
                    <Field label="Fatores que Pioram">
                        <input type="text" name="fatoresAgravantes" value={answers.fatoresAgravantes}
                            onChange={onChange} placeholder="Ex: Escadas, posição sentada prolongada..." className={inputClass} />
                    </Field>
                    <Field label="Fatores que Melhoram">
                        <input type="text" name="fatoresMelhora" value={answers.fatoresMelhora}
                            onChange={onChange} placeholder="Ex: Repouso, compressa fria..." className={inputClass} />
                    </Field>
                    <Field label="Atividade Física">
                        <select name="atividadeFisica" value={answers.atividadeFisica} onChange={onChange} className={selectClass}>
                            <option value="sedentario">Sedentário</option>
                            <option value="leve">Leve (caminhadas)</option>
                            <option value="moderado">Moderado (3x/semana)</option>
                            <option value="intenso">Intenso (diário)</option>
                        </select>
                    </Field>
                    <Field label="Qualidade do Sono">
                        <select name="qualidadeDeSono" value={answers.qualidadeDeSono} onChange={onChange} className={selectClass}>
                            <option value="boa">Boa</option>
                            <option value="regular">Regular</option>
                            <option value="ruim">Ruim (dor interfere no sono)</option>
                        </select>
                    </Field>
                    <Field label="Cirurgias Anteriores">
                        <input type="text" name="cirurgiasAnteriores" value={answers.cirurgiasAnteriores}
                            onChange={onChange} placeholder="Ex: Meniscectomia 2020, nenhuma..." className={inputClass} />
                    </Field>
                    <Field label="Medicamentos em Uso">
                        <input type="text" name="medicamentosEmUso" value={answers.medicamentosEmUso}
                            onChange={onChange} placeholder="Ex: Ibuprofeno 600mg, nenhum..." className={inputClass} />
                    </Field>
                    <Field label="Alergias">
                        <input type="text" name="alergias" value={answers.alergias}
                            onChange={onChange} placeholder="Ex: Dipirona, látex, nenhuma..." className={inputClass} />
                    </Field>
                    <Field label="Histórico Familiar Relevante">
                        <input type="text" name="historicoFamiliar" value={answers.historicoFamiliar}
                            onChange={onChange} placeholder="Ex: Artrite reumatoide na mãe..." className={inputClass} />
                    </Field>
                </div>
            </div>
        </section>
    );
}

function PedForm({ answers, onChange }: any) {
    return (
        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
            <h3 className="mb-8 text-xl font-bold text-sage-700 dark:text-white">Anamnese — Pediátrico / Neurológico</h3>
            <div className="space-y-10">

                {/* Identificação clínica */}
                <div>
                    <p className={sectionLabel}>Identificação Clínica</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <Field label="Queixa Principal *">
                            <textarea name="queixaPrincipal" required rows={2} value={answers.queixaPrincipal}
                                onChange={onChange} placeholder="Ex: Atraso no desenvolvimento motor..." className={textareaClass} />
                        </Field>
                        <Field label="Diagnóstico Médico">
                            <input type="text" name="diagnosticoMedico" value={answers.diagnosticoMedico}
                                onChange={onChange} placeholder="Ex: TEA, PC, Síndrome de Down..." className={inputClass} />
                        </Field>
                        <Field label="Médico Responsável">
                            <input type="text" name="medicoResponsavel" value={answers.medicoResponsavel}
                                onChange={onChange} placeholder="Ex: Dra. Camila Souza (Neuropediatra)" className={inputClass} />
                        </Field>
                        <Field label="Medicamentos em Uso">
                            <input type="text" name="medicamentos" value={answers.medicamentos}
                                onChange={onChange} placeholder="Ex: Risperidona 0,5mg, nenhum..." className={inputClass} />
                        </Field>
                        <Field label="Data Corrigida (prematuros)">
                            <input type="date" name="dataCorrigida" value={answers.dataCorrigida}
                                onChange={onChange} className={inputClass} />
                        </Field>
                    </div>
                </div>

                {/* Marcos do desenvolvimento */}
                <div>
                    <p className={sectionLabel}>Marcos do Desenvolvimento Motor</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                        {[
                            { name: "rolou", label: "Rolou" },
                            { name: "sentouComApoio", label: "Sentou com apoio" },
                            { name: "sentouSemApoio", label: "Sentou sem apoio" },
                            { name: "engatinhou", label: "Engatinhou" },
                            { name: "emPeSemApoio", label: "Em pé sem apoio" },
                            { name: "andou", label: "Andou" },
                        ].map(({ name, label }) => (
                            <Field key={name} label={label}>
                                <input type="text" name={name} value={answers[name]}
                                    onChange={onChange} placeholder="Ex: 8 meses / Não" className={inputClass} />
                            </Field>
                        ))}
                    </div>
                </div>

                {/* AVD */}
                <div>
                    <p className={sectionLabel}>Atividades da Vida Diária (AVD)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <Field label="Alimentação">
                            <input type="text" name="alimentacao" value={answers.alimentacao}
                                onChange={onChange} placeholder="Ex: Com ajuda, sem restrições..." className={inputClass} />
                        </Field>
                        <Field label="Banho">
                            <input type="text" name="banho" value={answers.banho}
                                onChange={onChange} placeholder="Ex: Com ajuda, independente..." className={inputClass} />
                        </Field>
                        <Field label="Usa Fralda?">
                            <select name="fralda" value={answers.fralda} onChange={onChange} className={selectClass}>
                                <option value="sim">Sim</option>
                                <option value="nao">Não</option>
                                <option value="parcial">Em transição</option>
                            </select>
                        </Field>
                        <Field label="Sono">
                            <input type="text" name="sono" value={answers.sono}
                                onChange={onChange} placeholder="Ex: Tranquilo, agitado, insônia..." className={inputClass} />
                        </Field>
                    </div>
                </div>

                {/* Avaliação motora */}
                <div>
                    <p className={sectionLabel}>Avaliação Motora</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <Field label="Tônus Muscular">
                            <input type="text" name="tonusMuscular" value={answers.tonusMuscular}
                                onChange={onChange} placeholder="Ex: Hipotonia, hipertonia, normal..." className={inputClass} />
                        </Field>
                        <Field label="Equilíbrio">
                            <input type="text" name="equilibrio" value={answers.equilibrio}
                                onChange={onChange} placeholder="Ex: Déficit, adequado..." className={inputClass} />
                        </Field>
                        <Field label="Coordenação Motora Grossa">
                            <input type="text" name="coordenacaoMotoraGrossa" value={answers.coordenacaoMotoraGrossa}
                                onChange={onChange} placeholder="Ex: +, ++, +++" className={inputClass} />
                        </Field>
                        <Field label="Coordenação Motora Fina">
                            <input type="text" name="coordenacaoMotoraFina" value={answers.coordenacaoMotoraFina}
                                onChange={onChange} placeholder="Ex: +, ++, +++" className={inputClass} />
                        </Field>
                        <Field label="Habilidades Motoras (correr, saltar, chutar)">
                            <textarea name="habilidades" rows={2} value={answers.habilidades}
                                onChange={onChange} placeholder="Ex: Corre com dificuldade, não salta, chuta com apoio..."
                                className={textareaClass} />
                        </Field>
                    </div>
                </div>
            </div>
        </section>
    );
}

const labelClass = "ml-2 text-xs font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500";
const sectionLabel = "text-sm font-bold text-sage-500 dark:text-zinc-400 uppercase tracking-wider border-b border-sage-100 dark:border-zinc-800 pb-2";
const inputClass = "w-full rounded-[1.25rem] border border-sage-200 bg-[#fdfdfc] px-4 py-4 text-sm outline-none focus:border-brand-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all";
const textareaClass = "w-full rounded-[1.25rem] border border-sage-200 bg-[#fdfdfc] px-4 py-4 text-sm outline-none focus:border-brand-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all resize-none";
const selectClass = "w-full rounded-[1.25rem] border border-sage-200 bg-[#fdfdfc] px-4 py-4 text-sm outline-none focus:border-brand-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className={labelClass}>{label}</label>
            {children}
        </div>
    );
}
