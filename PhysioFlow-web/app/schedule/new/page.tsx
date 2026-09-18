"use client";

import { Sidebar } from "@/components/Sidebar";
import { FieldLabelText } from "@/components/FieldLabel";
import { ArrowLeft, User, Calendar, Clock, DollarSign, FileText, Save, Loader2, Info, UserPlus, ChevronRight } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { QuickPatientForm } from "@/components/QuickPatientForm";
import { DraftBadge } from "@/components/DraftBadge";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { formatPaymentDay } from "@/lib/paymentDay";

const cycleLabel: Record<number, string> = {
    1: "Por Sessão",
    2: "Quinzenal",
    3: "Mensal",
    4: "Semanal"
};

function NewAppointmentForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefilledPatientId = searchParams.get("patientId") ?? "";
    const prefilledDate = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

    const [patients, setPatients] = useState<any[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [loadingPatient, setLoadingPatient] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showQuickForm, setShowQuickForm] = useState(false);

    const [formData, setFormData] = useState({
        patientId: prefilledPatientId,
        date: prefilledDate,
        startTime: "",
        endTime: "",
        sessionValue: "",
        notes: "",
    });

    useEffect(() => {
        apiFetch("/patients")
            .then(data => setPatients(data.filter((p: any) => p.isActive)))
            .catch(() => {})
            .finally(() => setLoadingPatients(false));
    }, []);

    // Quando a lista carregar e tiver patientId na URL, carrega os dados do paciente
    useEffect(() => {
        if (prefilledPatientId && patients.length > 0 && !selectedPatient) {
            handlePatientChange(prefilledPatientId);
        }
    }, [patients.length]); // eslint-disable-line

    const handlePatientChange = async (patientId: string) => {
        setFormData(prev => ({ ...prev, patientId }));
        setSelectedPatient(null);
        if (!patientId) return;

        setLoadingPatient(true);
        try {
            const data = await apiFetch(`/patients/${patientId}`);
            setSelectedPatient(data);
            if (data.defaultSessionValue) {
                setFormData(prev => ({ ...prev, sessionValue: String(data.defaultSessionValue) }));
            }
        } catch {
            // silencia erro
        } finally {
            setLoadingPatient(false);
        }
    };

    // Um pré-cadastro recém-criado ainda não está na lista carregada no início,
    // então ele entra nela na mão antes de ser selecionado.
    const handleQuickPatientCreated = (patient: any) => {
        setPatients(prev => [...prev, patient].sort((a, b) => a.fullName.localeCompare(b.fullName)));
        setShowQuickForm(false);
        setFormData(prev => ({ ...prev, patientId: patient.id }));
        setSelectedPatient(patient);
    };

    const handleSelectExisting = (patientId: string) => {
        setShowQuickForm(false);
        handlePatientChange(patientId);
    };

    const handleStartTimeChange = (value: string) => {
        setFormData(prev => {
            const updated = { ...prev, startTime: value };
            if (value && !prev.endTime) {
                const [h, m] = value.split(":").map(Number);
                const endH = (h + 1) % 24;
                updated.endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            }
            return updated;
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await apiFetch("/appointments", {
                method: "POST",
                body: JSON.stringify({
                    patientId: formData.patientId,
                    startDateTime: new Date(`${formData.date}T${formData.startTime}:00`).toISOString(),
                    endDateTime: new Date(`${formData.date}T${formData.endTime}:00`).toISOString(),
                    sessionValue: parseFloat(formData.sessionValue),
                    notes: formData.notes || null,
                }),
            });
            router.push("/schedule");
        } catch (err: any) {
            setError(err.message || "Erro ao criar agendamento");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <header className="mb-10 flex items-center gap-6">
                    <Link href="/schedule" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-sage-200 text-sage-500 hover:bg-sage-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all shadow-sm">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-sage-700 dark:text-white font-serif">Novo Agendamento</h1>
                        <p className="text-sage-500 dark:text-zinc-500 mt-1">Agende uma nova sessão de fisioterapia.</p>
                    </div>
                </header>

                {error && (
                    <div className="mx-auto max-w-2xl mb-6 rounded-xl bg-red-500/10 p-4 text-sm font-medium text-red-500 border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">

                    {/* Seção 1 - Paciente */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-8 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                <User size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-sage-700 dark:text-white">Paciente</h3>
                        </div>

                        {!showQuickForm && (
                            <>
                                <Field label="Paciente já cadastrado *">
                                    <CustomSelect
                                        value={formData.patientId}
                                        onChange={(value) => handlePatientChange(value)}
                                        options={patients.map(p => ({
                                            value: p.id,
                                            label: p.isDraft ? `${p.fullName} - cadastro incompleto` : p.fullName,
                                        }))}
                                        placeholder={loadingPatients ? "Carregando..." : "Selecione o paciente"}
                                        disabled={loadingPatients}
                                        icon={<User size={18} />}
                                        required
                                    />
                                </Field>

                                {/* Separador: deixa explícito que existem DOIS caminhos,
                                    em vez de um link discreto que passa despercebido */}
                                <div className="my-5 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-sage-200 dark:bg-zinc-800" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-sage-400 dark:text-zinc-600">
                                        ou
                                    </span>
                                    <div className="h-px flex-1 bg-sage-200 dark:bg-zinc-800" />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowQuickForm(true)}
                                    className="group flex w-full items-center gap-3 rounded-2xl border border-brand-primary/40 bg-brand-soft/50 p-4 text-left transition-all hover:border-brand-primary hover:bg-brand-soft dark:border-brand-primary/30 dark:bg-brand-primary/5 dark:hover:bg-brand-primary/10"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm shadow-brand-primary/30">
                                        <UserPlus size={19} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-sage-800 dark:text-white">
                                            Paciente novo, ainda sem cadastro
                                        </p>
                                        <p className="mt-0.5 text-xs leading-relaxed text-sage-500 dark:text-zinc-400">
                                            Marque a consulta só com nome e telefone
                                        </p>
                                    </div>
                                    <ChevronRight size={18} className="shrink-0 text-brand-primary transition-transform group-hover:translate-x-0.5" />
                                </button>
                            </>
                        )}

                        {showQuickForm && (
                            <QuickPatientForm
                                onCreated={handleQuickPatientCreated}
                                onSelectExisting={handleSelectExisting}
                                onCancel={() => setShowQuickForm(false)}
                            />
                        )}

                        {loadingPatient && (
                            <div className="mt-4 flex items-center gap-2 text-xs text-sage-400">
                                <Loader2 size={12} className="animate-spin" />
                                Carregando dados do paciente...
                            </div>
                        )}

                        {selectedPatient?.isDraft && !loadingPatient && (
                            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 dark:border-amber-500/40 dark:bg-amber-500/10">
                                <DraftBadge size="sm" />
                                <p className="mt-2 text-xs leading-relaxed text-amber-800 dark:text-amber-400/90">
                                    Pode marcar a consulta normalmente. Só lembre de completar o
                                    cadastro até o dia do atendimento, senão não vai dar para
                                    registrar a evolução da sessão.
                                </p>
                                <Link
                                    href={`/patients/${selectedPatient.id}/edit`}
                                    className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30"
                                >
                                    Completar cadastro agora
                                    <ChevronRight size={14} />
                                </Link>
                            </div>
                        )}

                        {selectedPatient && !selectedPatient.isDraft && !loadingPatient && (
                            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-brand-soft px-4 py-3 dark:bg-brand-primary/10">
                                <Info size={16} className="text-brand-primary mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-brand-secondary dark:text-brand-primary">
                                        Ciclo de Pagamento: {cycleLabel[selectedPatient.paymentCycle] ?? "Por Sessão"}
                                    </p>
                                    {formatPaymentDay(selectedPatient.paymentCycle, selectedPatient.paymentDay) && (
                                        <p className="text-xs text-brand-secondary/70 dark:text-brand-primary/70 mt-0.5">
                                            Pagamento: {formatPaymentDay(selectedPatient.paymentCycle, selectedPatient.paymentDay)}
                                        </p>
                                    )}
                                    {selectedPatient.paymentCycle !== 1 && (
                                        <p className="text-xs text-brand-secondary/60 dark:text-brand-primary/50 mt-1 italic">
                                            Ao concluir a sessão, use "Pagar depois" na agenda.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Seção 2 - Data e Horário */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-8 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                <Calendar size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-sage-700 dark:text-white">Data e Horário</h3>
                        </div>

                        <div className="space-y-5">
                            <Field label="Data *">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">
                                        <Calendar size={18} />
                                    </div>
                                    <input type="date" name="date" required value={formData.date} onChange={handleChange} className="wellness-input" />
                                </div>
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Início *">
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">
                                            <Clock size={18} />
                                        </div>
                                        <input
                                            type="time"
                                            name="startTime"
                                            required
                                            value={formData.startTime}
                                            onChange={(e) => handleStartTimeChange(e.target.value)}
                                            className="wellness-input"
                                        />
                                    </div>
                                </Field>

                                <Field label="Fim *">
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">
                                            <Clock size={18} />
                                        </div>
                                        <input type="time" name="endTime" required value={formData.endTime} onChange={handleChange} className="wellness-input" />
                                    </div>
                                </Field>
                            </div>

                            {formData.startTime && formData.endTime && (
                                <p className="text-xs text-sage-400 ml-2">
                                    Duração: {calcDuration(formData.startTime, formData.endTime)}
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Seção 3 - Valor e Observações */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-8 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                <DollarSign size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-sage-700 dark:text-white">Valor e Observações</h3>
                        </div>

                        <div className="space-y-5">
                            <Field label="Valor da Sessão (R$) *">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">
                                        <DollarSign size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        name="sessionValue"
                                        required
                                        step="0.01"
                                        min="0"
                                        placeholder="150,00"
                                        value={formData.sessionValue}
                                        onChange={handleChange}
                                        className="wellness-input"
                                    />
                                </div>
                            </Field>

                            {selectedPatient && selectedPatient.paymentCycle !== 1 && (
                                <div className="flex items-center gap-2 rounded-2xl bg-brand-soft/60 px-4 py-3 border border-brand-primary/20 dark:bg-brand-primary/10 dark:border-brand-primary/20">
                                    <Info size={14} className="text-brand-primary shrink-0" />
                                    <p className="text-xs text-brand-secondary dark:text-brand-primary">
                                        Cobrança {selectedPatient.paymentCycle === 3 ? "mensal" : selectedPatient.paymentCycle === 4 ? "semanal" : "quinzenal"} - o valor é registrado por sessão e cobrado depois via Financeiro.
                                    </p>
                                </div>
                            )}

                            <Field label="Observações (opcional)">
                                <div className="relative">
                                    <div className="absolute left-4 top-4 text-sage-400">
                                        <FileText size={18} />
                                    </div>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Ex: Trazer exame de imagem, paciente com dor lombar..."
                                        className="wellness-input resize-none"
                                        style={{ paddingTop: "1rem" }}
                                    />
                                </div>
                            </Field>
                        </div>
                    </section>

                    <footer className="flex justify-end gap-4 pb-4">
                        <Link href="/schedule" className="px-8 py-4 text-sm font-bold text-sage-500 hover:text-sage-700 transition-colors">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 rounded-2xl bg-brand-primary px-10 py-4 font-bold text-white shadow-xl shadow-brand-primary/20 transition-all hover:bg-brand-secondary hover:translate-y-[-2px] disabled:opacity-50">
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Salvar Agendamento
                        </button>
                    </footer>
                </form>
            </main>

            <style jsx global>{`
                .wellness-input { width: 100%; border-radius: 1.25rem; border: 1px solid #e4e9e5; background-color: #fdfdfc; padding: 1rem 1rem 1rem 3rem; font-size: 0.875rem; transition: all 0.3s; outline: none; color: #3d5a4a; }
                .dark .wellness-input { border-color: #2c3530; background-color: #1a201d; color: white; }
                .wellness-input:focus { border-color: #14b8a6; box-shadow: 0 0 0 4px rgba(20,184,166,0.08); }
            `}</style>
        </div>
    );
}

// O wrapper com Suspense é necessário para o useSearchParams funcionar no Next.js
export default function NewAppointmentPage() {
    return (
        <Suspense>
            <NewAppointmentForm />
        </Suspense>
    );
}

function calcDuration(start: string, end: string): string {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const totalMin = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMin <= 0) return "-";
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500"><FieldLabelText label={label} /></label>
            {children}
        </div>
    );
}
