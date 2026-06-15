"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, ClipboardList, Save, Loader2, Lock } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function NewAssessmentPage() {
    const router = useRouter();
    const { id } = useParams();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [patient, setPatient] = useState<any>(null);
    const [lastAssessment, setLastAssessment] = useState<any>(null);
    const [loadingCheck, setLoadingCheck] = useState(true);

    const [assessmentType, setAssessmentType] = useState("1");
    const [assessmentModel, setAssessmentModel] = useState("ortopedico");
    const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split("T")[0]);
    const [generalNotes, setGeneralNotes] = useState("");

    const [ortopedicoAnswers, setOrtopedicoAnswers] = useState({
        queixaPrincipal: "", diagnosticoMedico: "", medicoResponsavel: "",
        historicoDaDoenca: "", localDaDor: "", escalaDor: "0",
        fatoresAgravantes: "", fatoresMelhora: "", cirurgiasAnteriores: "",
        medicamentosEmUso: "", alergias: "", atividadeFisica: "sedentario",
        ocupacao: "", historicoFamiliar: "", qualidadeDeSono: "boa",
    });

    const [neuroAdultoAnswers, setNeuroAdultoAnswers] = useState({
        queixaPrincipal: "", diagnosticoMedico: "", medicoResponsavel: "",
        historicoDaDoenca: "", dataDoEvento: "", medicamentos: "", comorbidades: "",
        tonusMuscular: "", forcaMuscularMMSS: "", forcaMuscularMMII: "",
        sensibilidade: "", coordenacao: "", equilibrioEstatico: "",
        equilibrioDinamico: "", marcha: "", avdAlimentacao: "", avdBanho: "",
        avdVestuario: "", avdTransferencias: "", comunicacaoCognicao: "",
    });

    const [neuroInfantilAnswers, setNeuroInfantilAnswers] = useState({
        queixaPrincipal: "", diagnosticoMedico: "", medicoResponsavel: "",
        medicamentos: "", dataCorrigida: "", rolou: "", sentouComApoio: "",
        sentouSemApoio: "", engatinhou: "", emPeSemApoio: "", andou: "",
        alimentacao: "", banho: "", fralda: "sim", sono: "",
        tonusMuscular: "", coordenacaoMotoraGrossa: "", coordenacaoMotoraFina: "",
        equilibrio: "", habilidades: "",
    });

    const [respiratorioAnswers, setRespiratorioAnswers] = useState({
        queixaPrincipal: "", diagnosticoMedico: "", medicoResponsavel: "",
        historicoDaDoenca: "", medicamentos: "", alergias: "",
        tabagismo: "nao", tempoTabagismo: "", oxigenoterapia: "nao",
        padraoRespiratorio: "", auscultaPulmonar: "", saturacaoO2: "",
        frequenciaRespiratoria: "", tosse: "seca", dispneiaMRC: "0",
        expansibilidadeToraxica: "", forcaMuscularRespiratoria: "", avdLimitacoes: "",
    });

    useEffect(() => {
        Promise.all([
            apiFetch(`/patients/${id}`),
            apiFetch(`/assessments/patient/${id}`),
        ]).then(([patientData, assessmentsData]: [any, any[]]) => {
            setPatient(patientData);
            const sorted = [...assessmentsData].sort(
                (a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
            );
            setLastAssessment(sorted[0] ?? null);
            const age = Math.floor(
                (Date.now() - new Date(patientData.birthDate + "T12:00:00").getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            );
            if (age < 18) setAssessmentModel("neuro-infantil");
        }).catch(() => {}).finally(() => setLoadingCheck(false));
    }, [id]);

    const patientAge = patient
        ? Math.floor((Date.now() - new Date(patient.birthDate + "T12:00:00").getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

    const isMinor = patientAge !== null && patientAge < 18;

    const availableModels = isMinor
        ? [{ value: "neuro-infantil", label: "Neuro Infantil / Neurológico" }]
        : [
            { value: "ortopedico", label: "Ortopédico" },
            { value: "neuro-adulto", label: "Neuro Adulto" },
            { value: "respiratorio", label: "Respiratório" },
        ];

    const daysSinceLast = lastAssessment
        ? Math.floor((Date.now() - new Date(lastAssessment.assessmentDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const daysLeft = daysSinceLast !== null ? Math.max(0, 90 - daysSinceLast) : 0;

    const blockReason: string | null = (() => {
        if (loadingCheck) return null;
        if (assessmentType === "1" && lastAssessment)
            return "Já existe uma avaliação inicial — considere usar 'Reavaliação Trimestral'.";
        if (assessmentType === "2" && !lastAssessment)
            return "Ainda não há avaliação inicial registrada — considere criar uma primeiro.";
        if (assessmentType === "2" && daysSinceLast !== null && daysSinceLast < 90)
            return `Última avaliação foi há ${daysSinceLast} dia(s). Reavaliação recomendada após 90 dias (faltam ${daysLeft}).`;
        return null;
    })();

    const getCurrentAnswers = () => {
        switch (assessmentModel) {
            case "ortopedico": return { modelo: "ortopedico", ...ortopedicoAnswers };
            case "neuro-adulto": return { modelo: "neuro-adulto", ...neuroAdultoAnswers };
            case "neuro-infantil": return { modelo: "neuro-infantil", ...neuroInfantilAnswers };
            case "respiratorio": return { modelo: "respiratorio", ...respiratorioAnswers };
            default: return { modelo: assessmentModel };
        }
    };

    const makeHandler = (setter: React.Dispatch<React.SetStateAction<any>>) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setter((prev: any) => ({ ...prev, [name]: value }));
        };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await apiFetch("/assessments", {
                method: "POST",
                body: JSON.stringify({
                    patientId: id,
                    type: Number(assessmentType),
                    assessmentDate: `${assessmentDate}T12:00:00Z`,
                    anamnesisAnswers: JSON.stringify(getCurrentAnswers()),
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
                        <p className="text-sage-500 dark:text-zinc-500 mt-1">
                            {patient ? `${patient.fullName} · ${patientAge} anos` : "Registre a avaliação clínica do paciente."}
                        </p>
                    </div>
                </header>

                {blockReason && (
                    <div className="mx-auto max-w-4xl mb-6 flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 dark:bg-amber-950/20 dark:border-amber-900/40">
                        <Lock size={18} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Aviso</p>
                            <p className="text-sm text-amber-600 dark:text-amber-500 mt-0.5">{blockReason}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mx-auto max-w-4xl mb-6 rounded-xl bg-red-500/10 p-4 text-sm font-medium text-red-500 border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8">

                    {/* Identificação */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                <ClipboardList size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-sage-700 dark:text-white">Identificação da Avaliação</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className={lbl}>Modelo de Anamnese</label>
                                <CustomSelect
                                    value={assessmentModel}
                                    onChange={setAssessmentModel}
                                    options={availableModels}
                                    disabled={isMinor}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={lbl}>Tipo de Avaliação</label>
                                <CustomSelect
                                    value={assessmentType}
                                    onChange={setAssessmentType}
                                    options={[
                                        { value: "1", label: "Avaliação Inicial" },
                                        { value: "2", label: "Reavaliação Trimestral" },
                                        { value: "3", label: "Alta Clínica" },
                                    ]}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={lbl}>Data da Avaliação</label>
                                <input type="date" required value={assessmentDate}
                                    onChange={e => setAssessmentDate(e.target.value)} className={inp} />
                            </div>
                        </div>
                    </section>

                    {/* Formulário dinâmico */}
                    {assessmentModel === "ortopedico" && (
                        <OrtopedicoForm answers={ortopedicoAnswers} onChange={makeHandler(setOrtopedicoAnswers)} />
                    )}
                    {assessmentModel === "neuro-adulto" && (
                        <NeuroAdultoForm answers={neuroAdultoAnswers} onChange={makeHandler(setNeuroAdultoAnswers)} />
                    )}
                    {assessmentModel === "neuro-infantil" && (
                        <NeuroInfantilForm answers={neuroInfantilAnswers} onChange={makeHandler(setNeuroInfantilAnswers)} />
                    )}
                    {assessmentModel === "respiratorio" && (
                        <RespiratorioForm answers={respiratorioAnswers} onChange={makeHandler(setRespiratorioAnswers)} />
                    )}

                    {/* Observações */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <h3 className="mb-6 text-xl font-bold text-sage-700 dark:text-white">Observações Gerais</h3>
                        <textarea rows={4} value={generalNotes} onChange={e => setGeneralNotes(e.target.value)}
                            placeholder="Anotações livres, impressões clínicas, objetivos do tratamento..."
                            className={txta} />
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

// ─── ORTOPÉDICO ─────────────────────────────────────────────────────────────

function OrtopedicoForm({ answers, onChange }: any) {
    return (
        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
            <SectionHead title="Anamnese — Ortopédico" />
            <div className="space-y-8">
                <F label="Queixa Principal *">
                    <textarea name="queixaPrincipal" required rows={2} value={answers.queixaPrincipal} onChange={onChange}
                        placeholder="Ex: Dor no joelho direito há 3 semanas..." className={txta} />
                </F>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <F label="Diagnóstico Médico">
                        <input name="diagnosticoMedico" value={answers.diagnosticoMedico} onChange={onChange}
                            placeholder="Ex: Artrose grau 3, LCA roto..." className={inp} />
                    </F>
                    <F label="Médico Responsável">
                        <input name="medicoResponsavel" value={answers.medicoResponsavel} onChange={onChange}
                            placeholder="Ex: Dr. Fernando Mendes" className={inp} />
                    </F>
                </div>
                <F label="Histórico da Doença Atual">
                    <textarea name="historicoDaDoenca" rows={3} value={answers.historicoDaDoenca} onChange={onChange}
                        placeholder="Como surgiu, evolução, tratamentos anteriores..." className={txta} />
                </F>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className={lbl}>Escala de Dor (EVA)</label>
                        <span className={`rounded-full px-4 py-1 text-sm font-bold ${Number(answers.escalaDor) <= 3 ? "bg-green-100 text-green-600" : Number(answers.escalaDor) <= 6 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-500"}`}>
                            {answers.escalaDor}/10
                        </span>
                    </div>
                    <input type="range" name="escalaDor" min={0} max={10} value={answers.escalaDor} onChange={onChange} className="w-full accent-brand-primary" />
                    <div className="flex justify-between text-xs text-sage-400"><span>Sem dor</span><span>Moderada</span><span>Intensa</span></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <F label="Localização da Dor"><input name="localDaDor" value={answers.localDaDor} onChange={onChange} placeholder="Ex: Joelho direito..." className={inp} /></F>
                    <F label="Ocupação"><input name="ocupacao" value={answers.ocupacao} onChange={onChange} placeholder="Ex: Professora, motorista..." className={inp} /></F>
                    <F label="Fatores que Pioram"><input name="fatoresAgravantes" value={answers.fatoresAgravantes} onChange={onChange} placeholder="Ex: Escadas, posição sentada..." className={inp} /></F>
                    <F label="Fatores que Melhoram"><input name="fatoresMelhora" value={answers.fatoresMelhora} onChange={onChange} placeholder="Ex: Repouso, compressa fria..." className={inp} /></F>
                    <F label="Atividade Física">
                        <select name="atividadeFisica" value={answers.atividadeFisica} onChange={onChange} className={sel}>
                            <option value="sedentario">Sedentário</option>
                            <option value="leve">Leve (caminhadas)</option>
                            <option value="moderado">Moderado (3x/semana)</option>
                            <option value="intenso">Intenso (diário)</option>
                        </select>
                    </F>
                    <F label="Qualidade do Sono">
                        <select name="qualidadeDeSono" value={answers.qualidadeDeSono} onChange={onChange} className={sel}>
                            <option value="boa">Boa</option>
                            <option value="regular">Regular</option>
                            <option value="ruim">Ruim (dor interfere)</option>
                        </select>
                    </F>
                    <F label="Cirurgias Anteriores"><input name="cirurgiasAnteriores" value={answers.cirurgiasAnteriores} onChange={onChange} placeholder="Ex: Meniscectomia 2020, nenhuma..." className={inp} /></F>
                    <F label="Medicamentos em Uso"><input name="medicamentosEmUso" value={answers.medicamentosEmUso} onChange={onChange} placeholder="Ex: Ibuprofeno 600mg..." className={inp} /></F>
                    <F label="Alergias"><input name="alergias" value={answers.alergias} onChange={onChange} placeholder="Ex: Dipirona, látex, nenhuma..." className={inp} /></F>
                    <F label="Histórico Familiar"><input name="historicoFamiliar" value={answers.historicoFamiliar} onChange={onChange} placeholder="Ex: Artrite reumatoide na mãe..." className={inp} /></F>
                </div>
            </div>
        </section>
    );
}

// ─── NEURO ADULTO ────────────────────────────────────────────────────────────

function NeuroAdultoForm({ answers, onChange }: any) {
    return (
        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
            <SectionHead title="Anamnese — Neuro Adulto" />
            <div className="space-y-10">
                <div>
                    <p className={grp}>Identificação Clínica</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <F label="Queixa Principal *">
                            <textarea name="queixaPrincipal" required rows={2} value={answers.queixaPrincipal} onChange={onChange}
                                placeholder="Ex: Hemiplegia após AVC, tremor em repouso..." className={txta} />
                        </F>
                        <F label="Diagnóstico Médico"><input name="diagnosticoMedico" value={answers.diagnosticoMedico} onChange={onChange} placeholder="Ex: AVC isquêmico, Parkinson..." className={inp} /></F>
                        <F label="Médico Responsável"><input name="medicoResponsavel" value={answers.medicoResponsavel} onChange={onChange} placeholder="Ex: Dr. Carlos Neurology" className={inp} /></F>
                        <F label="Data do Evento"><input type="date" name="dataDoEvento" value={answers.dataDoEvento} onChange={onChange} className={inp} /></F>
                        <F label="Medicamentos"><input name="medicamentos" value={answers.medicamentos} onChange={onChange} placeholder="Ex: AAS 100mg, Levodopa..." className={inp} /></F>
                        <F label="Comorbidades"><input name="comorbidades" value={answers.comorbidades} onChange={onChange} placeholder="Ex: HAS, DM2, FA..." className={inp} /></F>
                    </div>
                    <div className="mt-6">
                        <F label="Histórico da Doença Atual">
                            <textarea name="historicoDaDoenca" rows={3} value={answers.historicoDaDoenca} onChange={onChange}
                                placeholder="Evolução, internações, cirurgias prévias..." className={txta} />
                        </F>
                    </div>
                </div>
                <div>
                    <p className={grp}>Avaliação Neurológica</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <F label="Tônus Muscular"><input name="tonusMuscular" value={answers.tonusMuscular} onChange={onChange} placeholder="Ex: Espasticidade MMSS, hipotonia..." className={inp} /></F>
                        <F label="Força Muscular MMSS"><input name="forcaMuscularMMSS" value={answers.forcaMuscularMMSS} onChange={onChange} placeholder="Ex: 3/5 D, 5/5 E (MRC)" className={inp} /></F>
                        <F label="Força Muscular MMII"><input name="forcaMuscularMMII" value={answers.forcaMuscularMMII} onChange={onChange} placeholder="Ex: 4/5 bilateral" className={inp} /></F>
                        <F label="Sensibilidade"><input name="sensibilidade" value={answers.sensibilidade} onChange={onChange} placeholder="Ex: Hipoestesia hemi-esquerda..." className={inp} /></F>
                        <F label="Coordenação"><input name="coordenacao" value={answers.coordenacao} onChange={onChange} placeholder="Ex: Dismetria à esquerda..." className={inp} /></F>
                        <F label="Equilíbrio Estático"><input name="equilibrioEstatico" value={answers.equilibrioEstatico} onChange={onChange} placeholder="Ex: Presente com oscilação, ausente..." className={inp} /></F>
                        <F label="Equilíbrio Dinâmico"><input name="equilibrioDinamico" value={answers.equilibrioDinamico} onChange={onChange} placeholder="Ex: Déficit com troca de base..." className={inp} /></F>
                        <F label="Marcha"><input name="marcha" value={answers.marcha} onChange={onChange} placeholder="Ex: Ceifante, festinante, com bengala..." className={inp} /></F>
                    </div>
                </div>
                <div>
                    <p className={grp}>Atividades da Vida Diária (AVD)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <F label="Alimentação"><input name="avdAlimentacao" value={answers.avdAlimentacao} onChange={onChange} placeholder="Ex: Independente, com auxílio..." className={inp} /></F>
                        <F label="Banho"><input name="avdBanho" value={answers.avdBanho} onChange={onChange} placeholder="Ex: Dependente parcial..." className={inp} /></F>
                        <F label="Vestuário"><input name="avdVestuario" value={answers.avdVestuario} onChange={onChange} placeholder="Ex: Necessita de auxílio..." className={inp} /></F>
                        <F label="Transferências"><input name="avdTransferencias" value={answers.avdTransferencias} onChange={onChange} placeholder="Ex: Leito→cadeira com cuidador..." className={inp} /></F>
                    </div>
                </div>
                <F label="Comunicação / Cognição">
                    <textarea name="comunicacaoCognicao" rows={3} value={answers.comunicacaoCognicao} onChange={onChange}
                        placeholder="Ex: Afasia motora, desorientação t/e, comunicação preservada..." className={txta} />
                </F>
            </div>
        </section>
    );
}

// ─── NEURO INFANTIL ──────────────────────────────────────────────────────────

function NeuroInfantilForm({ answers, onChange }: any) {
    return (
        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
            <SectionHead title="Anamnese — Neuro Infantil" />
            <div className="space-y-10">
                <div>
                    <p className={grp}>Identificação Clínica</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <F label="Queixa Principal *">
                            <textarea name="queixaPrincipal" required rows={2} value={answers.queixaPrincipal} onChange={onChange}
                                placeholder="Ex: Atraso no desenvolvimento motor..." className={txta} />
                        </F>
                        <F label="Diagnóstico Médico"><input name="diagnosticoMedico" value={answers.diagnosticoMedico} onChange={onChange} placeholder="Ex: TEA, PC, Síndrome de Down..." className={inp} /></F>
                        <F label="Médico Responsável"><input name="medicoResponsavel" value={answers.medicoResponsavel} onChange={onChange} placeholder="Ex: Dra. Camila (Neuropediatra)" className={inp} /></F>
                        <F label="Medicamentos em Uso"><input name="medicamentos" value={answers.medicamentos} onChange={onChange} placeholder="Ex: Risperidona 0,5mg, nenhum..." className={inp} /></F>
                        <F label="Data Corrigida (prematuros)"><input type="date" name="dataCorrigida" value={answers.dataCorrigida} onChange={onChange} className={inp} /></F>
                    </div>
                </div>
                <div>
                    <p className={grp}>Marcos do Desenvolvimento Motor</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                        {[["rolou","Rolou"],["sentouComApoio","Sentou com apoio"],["sentouSemApoio","Sentou sem apoio"],["engatinhou","Engatinhou"],["emPeSemApoio","Em pé sem apoio"],["andou","Andou"]].map(([name, label]) => (
                            <F key={name} label={label}>
                                <input name={name} value={answers[name]} onChange={onChange} placeholder="Ex: 8 meses / Não" className={inp} />
                            </F>
                        ))}
                    </div>
                </div>
                <div>
                    <p className={grp}>Atividades da Vida Diária (AVD)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <F label="Alimentação"><input name="alimentacao" value={answers.alimentacao} onChange={onChange} placeholder="Ex: Com ajuda, sem restrições..." className={inp} /></F>
                        <F label="Banho"><input name="banho" value={answers.banho} onChange={onChange} placeholder="Ex: Com ajuda, independente..." className={inp} /></F>
                        <F label="Usa Fralda?">
                            <select name="fralda" value={answers.fralda} onChange={onChange} className={sel}>
                                <option value="sim">Sim</option>
                                <option value="nao">Não</option>
                                <option value="parcial">Em transição</option>
                            </select>
                        </F>
                        <F label="Sono"><input name="sono" value={answers.sono} onChange={onChange} placeholder="Ex: Tranquilo, agitado, insônia..." className={inp} /></F>
                    </div>
                </div>
                <div>
                    <p className={grp}>Avaliação Motora</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <F label="Tônus Muscular"><input name="tonusMuscular" value={answers.tonusMuscular} onChange={onChange} placeholder="Ex: Hipotonia, hipertonia, normal..." className={inp} /></F>
                        <F label="Equilíbrio"><input name="equilibrio" value={answers.equilibrio} onChange={onChange} placeholder="Ex: Déficit, adequado..." className={inp} /></F>
                        <F label="Coordenação Motora Grossa"><input name="coordenacaoMotoraGrossa" value={answers.coordenacaoMotoraGrossa} onChange={onChange} placeholder="Ex: +, ++, +++" className={inp} /></F>
                        <F label="Coordenação Motora Fina"><input name="coordenacaoMotoraFina" value={answers.coordenacaoMotoraFina} onChange={onChange} placeholder="Ex: +, ++, +++" className={inp} /></F>
                        <F label="Habilidades Motoras">
                            <textarea name="habilidades" rows={2} value={answers.habilidades} onChange={onChange}
                                placeholder="Ex: Corre com dificuldade, não salta..." className={txta} />
                        </F>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── RESPIRATÓRIO ────────────────────────────────────────────────────────────

function RespiratorioForm({ answers, onChange }: any) {
    return (
        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
            <SectionHead title="Anamnese — Respiratório" />
            <div className="space-y-10">
                <div>
                    <p className={grp}>Identificação Clínica</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <F label="Queixa Principal *">
                            <textarea name="queixaPrincipal" required rows={2} value={answers.queixaPrincipal} onChange={onChange}
                                placeholder="Ex: Falta de ar aos esforços, tosse crônica..." className={txta} />
                        </F>
                        <F label="Diagnóstico Médico"><input name="diagnosticoMedico" value={answers.diagnosticoMedico} onChange={onChange} placeholder="Ex: DPOC, asma, pós-COVID..." className={inp} /></F>
                        <F label="Médico Responsável"><input name="medicoResponsavel" value={answers.medicoResponsavel} onChange={onChange} placeholder="Ex: Dra. Sandra (Pneumologista)" className={inp} /></F>
                        <F label="Medicamentos"><input name="medicamentos" value={answers.medicamentos} onChange={onChange} placeholder="Ex: Budesonida, salbutamol..." className={inp} /></F>
                        <F label="Alergias"><input name="alergias" value={answers.alergias} onChange={onChange} placeholder="Ex: Dipirona, poeira, nenhuma..." className={inp} /></F>
                    </div>
                    <div className="mt-6">
                        <F label="Histórico da Doença Atual">
                            <textarea name="historicoDaDoenca" rows={3} value={answers.historicoDaDoenca} onChange={onChange}
                                placeholder="Evolução, internações, crises anteriores..." className={txta} />
                        </F>
                    </div>
                </div>
                <div>
                    <p className={grp}>Fatores de Risco e Suporte</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <F label="Tabagismo">
                            <select name="tabagismo" value={answers.tabagismo} onChange={onChange} className={sel}>
                                <option value="nao">Não fumante</option>
                                <option value="sim">Fumante ativo</option>
                                <option value="ex">Ex-fumante</option>
                            </select>
                        </F>
                        {answers.tabagismo !== "nao" && (
                            <F label="Tempo / Carga Tabágica"><input name="tempoTabagismo" value={answers.tempoTabagismo} onChange={onChange} placeholder="Ex: 20 anos/maço, parou há 5 anos..." className={inp} /></F>
                        )}
                        <F label="Oxigenoterapia">
                            <select name="oxigenoterapia" value={answers.oxigenoterapia} onChange={onChange} className={sel}>
                                <option value="nao">Não</option>
                                <option value="sim">Sim (contínua)</option>
                                <option value="noturna">Noturna</option>
                                <option value="esforco">Aos esforços</option>
                            </select>
                        </F>
                    </div>
                </div>
                <div>
                    <p className={grp}>Avaliação Respiratória</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <F label="Padrão Respiratório"><input name="padraoRespiratorio" value={answers.padraoRespiratorio} onChange={onChange} placeholder="Ex: Misto, costal superior, diafragmático..." className={inp} /></F>
                        <F label="Ausculta Pulmonar"><input name="auscultaPulmonar" value={answers.auscultaPulmonar} onChange={onChange} placeholder="Ex: MV reduzido em bases, sibilos..." className={inp} /></F>
                        <F label="Saturação de O₂ (SpO₂)"><input name="saturacaoO2" value={answers.saturacaoO2} onChange={onChange} placeholder="Ex: 94% em ar ambiente" className={inp} /></F>
                        <F label="Frequência Respiratória"><input name="frequenciaRespiratoria" value={answers.frequenciaRespiratoria} onChange={onChange} placeholder="Ex: 18 irpm" className={inp} /></F>
                        <F label="Tosse">
                            <select name="tosse" value={answers.tosse} onChange={onChange} className={sel}>
                                <option value="ausente">Ausente</option>
                                <option value="seca">Seca</option>
                                <option value="produtiva">Produtiva</option>
                                <option value="produtiva-purulenta">Produtiva purulenta</option>
                            </select>
                        </F>
                        <F label="Dispneia (Escala MRC 0–4)">
                            <select name="dispneiaMRC" value={answers.dispneiaMRC} onChange={onChange} className={sel}>
                                <option value="0">0 — Só ao exercício intenso</option>
                                <option value="1">1 — Ao subir ladeira ou andar rápido</option>
                                <option value="2">2 — Anda mais devagar que o normal</option>
                                <option value="3">3 — Para ao andar 100m em plano</option>
                                <option value="4">4 — Não sai de casa / em repouso</option>
                            </select>
                        </F>
                        <F label="Expansibilidade Torácica"><input name="expansibilidadeToraxica" value={answers.expansibilidadeToraxica} onChange={onChange} placeholder="Ex: Simétrica, reduzida em bases..." className={inp} /></F>
                        <F label="Força Muscular Respiratória"><input name="forcaMuscularRespiratoria" value={answers.forcaMuscularRespiratoria} onChange={onChange} placeholder="Ex: PiMax/PeMax reduzidos..." className={inp} /></F>
                    </div>
                </div>
                <F label="AVDs e Limitações Funcionais">
                    <textarea name="avdLimitacoes" rows={3} value={answers.avdLimitacoes} onChange={onChange}
                        placeholder="Ex: Dispneia ao vestir-se, não consegue subir escadas..." className={txta} />
                </F>
            </div>
        </section>
    );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function SectionHead({ title }: { title: string }) {
    return <h3 className="mb-8 text-xl font-bold text-sage-700 dark:text-white">{title}</h3>;
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className={lbl}>{label}</label>
            {children}
        </div>
    );
}

const lbl = "ml-2 text-xs font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500";
const grp = "text-sm font-bold text-sage-500 dark:text-zinc-400 uppercase tracking-wider border-b border-sage-100 dark:border-zinc-800 pb-2";
const inp = "w-full rounded-[1.25rem] border border-sage-200 bg-[#fdfdfc] px-4 py-4 text-sm outline-none focus:border-brand-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all";
const txta = "w-full rounded-[1.25rem] border border-sage-200 bg-[#fdfdfc] px-4 py-4 text-sm outline-none focus:border-brand-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all resize-none";
const sel = "w-full rounded-[1.25rem] border border-sage-200 bg-[#fdfdfc] px-4 py-4 text-sm outline-none focus:border-brand-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all";
