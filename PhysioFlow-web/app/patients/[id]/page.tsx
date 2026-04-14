"use client";

import { Sidebar } from "@/components/Sidebar";
import {
    ArrowLeft, Edit3, Calendar, Plus, FileText,
    User, Phone, Mail, ShieldCheck, TrendingUp, History, Activity,
    UserX, Loader2, MapPin, DollarSign, RefreshCw, CheckCircle, Clock,
    AlertTriangle, Paperclip, Upload, Download, Trash2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

const cycleLabel: Record<number, string> = { 1: "Por Sessão", 2: "Quinzenal", 3: "Mensal", 4: "Semanal" };

export default function PatientDetailsPage() {
    const { id } = useParams();
    const [patient, setPatient] = useState<any>(null);
    const [evolutions, setEvolutions] = useState<any[]>([]);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [protocols, setProtocols] = useState<any[]>([]);
    const [guardian, setGuardian] = useState<any>(null);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [inactivating, setInactivating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleInactivate = async () => {
        if (!confirm(`Deseja inativar ${patient?.fullName}?`)) return;
        setInactivating(true);
        try {
            await apiFetch(`/patients/${id}/deactivate`, { method: "PATCH" });
            router.push("/patients");
        } catch (err: any) {
            alert(err.message || "Erro ao inativar paciente");
            setInactivating(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const token = localStorage.getItem('physioflow_token');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('patientId', id as string);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/attachments`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
            });
            if (!response.ok) throw new Error('Erro ao fazer upload');
            const newAttachment = await response.json();
            setAttachments(prev => [newAttachment, ...prev]);
        } catch (err: any) {
            alert(err.message || 'Erro ao fazer upload');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDownload = async (attachmentId: string, fileName: string) => {
        try {
            const token = localStorage.getItem('physioflow_token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/attachments/${attachmentId}/download`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            if (!response.ok) throw new Error('Erro ao baixar arquivo');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(err.message || 'Erro ao baixar arquivo');
        }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        if (!confirm('Excluir este anexo?')) return;
        try {
            await apiFetch(`/attachments/${attachmentId}`, { method: 'DELETE' });
            setAttachments(prev => prev.filter((a: any) => a.id !== attachmentId));
        } catch (err: any) {
            alert(err.message || 'Erro ao excluir anexo');
        }
    };

    useEffect(() => {
        async function loadData() {
            try {
                const [patientData, evolutionsData, assessmentsData, protocolsData, attachmentsData] = await Promise.all([
                    apiFetch(`/patients/${id}`),
                    apiFetch(`/evolutions/patient/${id}`),
                    apiFetch(`/assessments/patient/${id}`),
                    apiFetch(`/protocols/patient/${id}`),
                    apiFetch(`/attachments/patient/${id}`),
                ]);
                setPatient(patientData);
                setEvolutions(evolutionsData);
                setAssessments(assessmentsData);
                setProtocols(protocolsData);
                setAttachments(attachmentsData);
                if (patientData.guardianId) {
                    const guardianData = await apiFetch(`/guardians/${patientData.guardianId}`);
                    setGuardian(guardianData);
                }
            } catch (err: any) {
                setError(err.message || "Erro ao carregar dados");
            } finally {
                setLoading(false);
            }
        }
        if (id) loadData();
    }, [id]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
    };

    const formatDateTime = (dateStr: string) =>
        new Date(dateStr).toLocaleString("pt-BR", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-zinc-950">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        </div>
    );

    if (error) return (
        <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-zinc-950">
            <p className="text-red-500">{error}</p>
        </div>
    );

    const hasAddress = patient.street || patient.zipCode || patient.neighborhood;
    const activeProtocols = protocols.filter((p: any) => p.isActive);
    const inactiveProtocols = protocols.filter((p: any) => !p.isActive);

    const lastAssessment = assessments[0];
    const daysSince = lastAssessment
        ? Math.floor((Date.now() - new Date(lastAssessment.assessmentDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const needsReassessment = !lastAssessment || (daysSince !== null && daysSince >= 90);

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <header className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/patients" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-sage-200 text-sage-500 hover:bg-sage-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all shadow-sm">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-sage-800 dark:text-white font-serif">{patient.fullName}</h1>
                                {patient.isActive
                                    ? <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-secondary dark:bg-brand-primary/10 dark:text-brand-primary">Ativo</span>
                                    : <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-500">Inativo</span>
                                }
                            </div>
                            <p className="text-sage-500 dark:text-zinc-500 mt-1">Prontuário clínico completo</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href={`/patients/${id}/edit`} className="flex items-center gap-2 rounded-2xl border border-sage-200 bg-white px-5 py-3 text-sm font-bold text-sage-600 hover:bg-sage-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 transition-all">
                            <Edit3 size={18} />
                            Editar
                        </Link>
                        {patient?.isActive && (
                            <button onClick={handleInactivate} disabled={inactivating}
                                className="flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:bg-zinc-900 dark:border-red-900/30 transition-all disabled:opacity-50">
                                {inactivating ? <Loader2 size={18} className="animate-spin" /> : <UserX size={18} />}
                                Inativar
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

                    {/* ── COLUNA ESQUERDA ── */}
                    <div className="lg:col-span-4 space-y-5">

                        {/* Dados pessoais */}
                        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-8 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                            <h3 className="mb-6 flex items-center gap-2 text-base font-bold text-sage-700 dark:text-white">
                                <User size={18} className="text-brand-primary" />
                                Dados Pessoais
                            </h3>
                            <div className="space-y-4">
                                <InfoItem icon={<Calendar size={15} />} label="Nascimento" value={formatDate(patient.birthDate)} />
                                <InfoItem icon={<FileText size={15} />} label="CPF" value={patient.cpf || "Não informado"} />
                                <InfoItem icon={<Mail size={15} />} label="Email" value={patient.email || "Não informado"} />
                                <InfoItem icon={<Phone size={15} />} label="Telefone" value={patient.phone || "Não informado"} />
                            </div>
                        </section>

                        {/* Endereço */}
                        {hasAddress && (
                            <section className="rounded-[2.5rem] border border-sage-200 bg-white p-8 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                                <h3 className="mb-6 flex items-center gap-2 text-base font-bold text-sage-700 dark:text-white">
                                    <MapPin size={18} className="text-brand-primary" />
                                    Endereço
                                </h3>
                                <div className="space-y-4">
                                    {patient.street && (
                                        <InfoItem icon={<MapPin size={15} />} label="Logradouro"
                                            value={[patient.street, patient.number, patient.complement].filter(Boolean).join(", ")} />
                                    )}
                                    {patient.neighborhood && (
                                        <InfoItem icon={<MapPin size={15} />} label="Bairro" value={patient.neighborhood} />
                                    )}
                                    {(patient.city || patient.state) && (
                                        <InfoItem icon={<MapPin size={15} />} label="Cidade"
                                            value={[patient.city, patient.state].filter(Boolean).join(" - ")} />
                                    )}
                                    {patient.zipCode && (
                                        <InfoItem icon={<MapPin size={15} />} label="CEP" value={patient.zipCode} />
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Pagamento */}
                        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-8 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                            <h3 className="mb-6 flex items-center gap-2 text-base font-bold text-sage-700 dark:text-white">
                                <DollarSign size={18} className="text-brand-primary" />
                                Pagamento
                            </h3>
                            <div className="space-y-4">
                                <InfoItem icon={<RefreshCw size={15} />} label="Ciclo"
                                    value={cycleLabel[patient.paymentCycle] ?? "Por Sessão"} />
                                {patient.paymentDay && (
                                    <InfoItem icon={<Calendar size={15} />} label="Dia de Pagamento" value={patient.paymentDay} />
                                )}
                                {patient.defaultSessionValue && (
                                    <InfoItem icon={<DollarSign size={15} />} label="Valor padrão / sessão"
                                        value={`R$ ${Number(patient.defaultSessionValue).toFixed(2).replace(".", ",")}`} />
                                )}
                            </div>
                        </section>

                        {/* Botão nova anamnese */}
                        <Link href={`/patients/${id}/assessments/new`}
                            className="flex items-center justify-center gap-2 rounded-[2rem] border border-sage-200 bg-white p-5 text-sm font-bold text-sage-600 hover:border-brand-primary/30 hover:text-brand-primary dark:bg-zinc-900/40 dark:border-zinc-900 dark:text-zinc-400 transition-all wellness-shadow">
                            <Plus size={18} />
                            Nova Anamnese
                        </Link>

                        {/* Responsável */}
                        {patient.guardianId && guardian && (
                            <section className="rounded-[2.5rem] border border-sage-200 bg-brand-soft p-8 dark:border-zinc-800 dark:bg-brand-primary/5">
                                <h3 className="mb-6 flex items-center gap-2 text-base font-bold text-brand-secondary dark:text-brand-primary">
                                    <ShieldCheck size={18} />
                                    Responsável Legal
                                </h3>
                                <div className="space-y-4">
                                    <InfoItem icon={<User size={15} />} label="Nome" value={guardian.fullName} />
                                    <InfoItem icon={<Phone size={15} />} label="Telefone" value={guardian.phone} />
                                    {guardian.email && <InfoItem icon={<Mail size={15} />} label="Email" value={guardian.email} />}
                                    {guardian.cpf && <InfoItem icon={<FileText size={15} />} label="CPF" value={guardian.cpf} />}
                                    {(guardian.city || guardian.state) && (
                                        <InfoItem icon={<MapPin size={15} />} label="Cidade"
                                            value={[guardian.city, guardian.state].filter(Boolean).join(" - ")} />
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* ── COLUNA DIREITA ── */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Protocolos ativos */}
                        {activeProtocols.length > 0 && (
                            <section className="rounded-[2.5rem] border-2 border-brand-primary/20 bg-white p-8 dark:bg-zinc-900/40">
                                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-sage-700 dark:text-white font-serif">
                                    <Activity size={20} className="text-brand-primary" />
                                    Protocolos Ativos
                                </h3>
                                <div className="space-y-4">
                                    {activeProtocols.map((p: any) => {
                                        const progress = p.sessionsPerCycle > 0
                                            ? Math.round((p.completedSessions / p.sessionsPerCycle) * 100)
                                            : 0;
                                        return (
                                            <div key={p.id} className="rounded-2xl bg-brand-soft/50 p-5 dark:bg-brand-primary/5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="font-bold text-sage-700 dark:text-white">{p.treatmentName}</p>
                                                    <span className="rounded-full bg-brand-soft px-3 py-0.5 text-xs font-bold text-brand-primary">
                                                        Ciclo {p.currentCycle}/{p.totalCycles}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 rounded-full bg-sage-200 dark:bg-zinc-700">
                                                        <div
                                                            className="h-2 rounded-full bg-brand-primary transition-all"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-sage-500 dark:text-zinc-400 shrink-0">
                                                        {p.completedSessions}/{p.sessionsPerCycle} sessões
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Evoluções */}
                        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-sage-700 dark:text-white font-serif">Histórico de Evoluções</h3>
                                    <p className="text-sage-500 mt-1 text-sm">{evolutions.length} registro(s)</p>
                                </div>
                                <Link href={`/patients/${id}/evolutions/new`}
                                    className="flex items-center gap-2 rounded-2xl bg-brand-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-secondary hover:translate-y-[-2px]">
                                    <Plus size={18} />
                                    Nova Evolução
                                </Link>
                            </div>

                            {evolutions.length === 0 ? (
                                <div className="py-12 text-center text-sage-400">
                                    <Activity size={40} className="mx-auto mb-3 text-sage-200 dark:text-zinc-700" />
                                    <p>Nenhuma evolução registrada ainda.</p>
                                </div>
                            ) : (
                                <div className="relative space-y-6 before:absolute before:left-6 before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-sage-100 dark:before:bg-zinc-800">
                                    {evolutions.map((evo: any, idx: number) => (
                                        <div key={evo.id} className="relative pl-16">
                                            <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-white border-4 border-sage-50 text-brand-primary wellness-shadow dark:bg-zinc-900 dark:border-zinc-950">
                                                {idx === 0 ? <TrendingUp size={20} /> : <History size={20} />}
                                            </div>
                                            <div className="rounded-[2rem] border border-sage-50 bg-sage-50/30 p-6 hover:bg-white hover:border-brand-primary/20 transition-all dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/40">
                                                <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">
                                                    {formatDateTime(evo.createdAt)}
                                                </span>
                                                <div className="mt-3 space-y-3">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase text-sage-400 mb-1">Procedimentos</p>
                                                        <p className="text-sm text-sage-600 dark:text-zinc-400">{evo.proceduresPerformed}</p>
                                                    </div>
                                                    {evo.techniquesApplied && (
                                                        <div>
                                                            <p className="text-xs font-bold uppercase text-sage-400 mb-1">Técnicas</p>
                                                            <p className="text-sm text-sage-600 dark:text-zinc-400">{evo.techniquesApplied}</p>
                                                        </div>
                                                    )}
                                                    {evo.painScale !== null && evo.painScale !== undefined && (
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-bold uppercase text-sage-400">EVA:</p>
                                                            <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${evo.painScale <= 3 ? "bg-green-100 text-green-600" : evo.painScale <= 6 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-500"}`}>
                                                                {evo.painScale}/10
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs font-bold uppercase text-sage-400 mb-1">Anotações</p>
                                                        <p className="text-sm text-sage-600 dark:text-zinc-400">{evo.clinicalNotes}</p>
                                                    </div>
                                                    {evo.nextSessionPlan && (
                                                        <div>
                                                            <p className="text-xs font-bold uppercase text-sage-400 mb-1">Próxima sessão</p>
                                                            <p className="text-sm text-sage-600 dark:text-zinc-400">{evo.nextSessionPlan}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Avaliações */}
                        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-sage-700 dark:text-white font-serif">Avaliações e Anamneses</h3>
                                    <p className="text-sage-500 mt-1 text-sm">{assessments.length} registro(s)</p>
                                </div>
                                <Link href={`/patients/${id}/assessments/new`}
                                    className="flex items-center gap-2 rounded-2xl border border-brand-primary/30 px-5 py-3 text-sm font-bold text-brand-primary hover:bg-brand-soft dark:hover:bg-brand-primary/10 transition-all">
                                    <Plus size={18} />
                                    Nova Avaliação
                                </Link>
                            </div>

                            {needsReassessment && (
                                <div className="mb-6 flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 dark:bg-amber-950/20 dark:border-amber-900/40">
                                    <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                        {lastAssessment
                                            ? `Última avaliação há ${daysSince} dias — considere fazer uma reavaliação.`
                                            : "Nenhuma avaliação registrada — considere fazer uma anamnese inicial."}
                                    </p>
                                </div>
                            )}

                            {assessments.length === 0 ? (
                                <div className="py-10 text-center text-sage-400">
                                    <FileText size={36} className="mx-auto mb-3 text-sage-200 dark:text-zinc-700" />
                                    <p>Nenhuma avaliação registrada ainda.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {assessments.map((assessment: any) => {
                                        let answers: any = {};
                                        try { answers = JSON.parse(assessment.anamnesisAnswers); } catch {}
                                        return (
                                            <div key={assessment.id} className="rounded-[1.5rem] border border-sage-100 bg-sage-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                                                                assessment.type === 1
                                                                    ? "bg-brand-soft text-brand-secondary dark:bg-brand-primary/10 dark:text-brand-primary"
                                                                    : assessment.type === 3
                                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                                    : "bg-amber-100 text-amber-700"
                                                            }`}>
                                                                {assessment.type === 1
                                                                    ? "Avaliação Inicial"
                                                                    : assessment.type === 3
                                                                    ? "Alta Clínica"
                                                                    : "Reavaliação Trimestral"}
                                                            </span>
                                                            <span className="text-xs text-sage-400">{formatDate(assessment.assessmentDate?.split("T")[0])}</span>
                                                        </div>
                                                        {answers.queixaPrincipal && (
                                                            <p className="text-sm text-sage-600 dark:text-zinc-400">
                                                                <span className="font-bold text-sage-500">Queixa: </span>{answers.queixaPrincipal}
                                                            </p>
                                                        )}
                                                        {assessment.generalNotes && (
                                                            <p className="mt-1 text-xs text-sage-400 italic">{assessment.generalNotes}</p>
                                                        )}
                                                    </div>
                                                    <Link href={`/patients/${id}/assessments/${assessment.id}`}
                                                        className="shrink-0 flex items-center gap-1.5 rounded-xl border border-sage-200 px-3 py-2 text-xs font-bold text-sage-500 hover:border-brand-primary/30 hover:text-brand-primary dark:border-zinc-700 dark:text-zinc-500 transition-all">
                                                        <FileText size={14} />
                                                        Ver Detalhes
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* Protocolos encerrados */}
                        {inactiveProtocols.length > 0 && (
                            <section className="rounded-[2.5rem] border border-sage-100 bg-white p-8 dark:border-zinc-900 dark:bg-zinc-900/40">
                                <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-sage-500 dark:text-zinc-400">
                                    <CheckCircle size={16} className="text-sage-400" />
                                    Protocolos Encerrados ({inactiveProtocols.length})
                                </h3>
                                <div className="space-y-3">
                                    {inactiveProtocols.map((p: any) => (
                                        <div key={p.id} className="flex items-center justify-between rounded-2xl bg-sage-50 px-5 py-3 dark:bg-zinc-900/40">
                                            <p className="text-sm font-semibold text-sage-500 dark:text-zinc-400">{p.treatmentName}</p>
                                            <span className="text-xs text-sage-400">{p.totalCycles} ciclo(s) · {p.sessionsPerCycle} sessões/ciclo</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Anexos */}
                        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-8 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-sage-700 dark:text-white font-serif flex items-center gap-2">
                                        <Paperclip size={20} className="text-brand-primary" />
                                        Anexos
                                    </h3>
                                    <p className="text-sage-500 mt-1 text-sm">{attachments.length} arquivo(s)</p>
                                </div>
                                <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                                    className="flex items-center gap-2 rounded-2xl border border-sage-200 bg-white px-5 py-3 text-sm font-bold text-sage-600 hover:border-brand-primary/30 hover:text-brand-primary dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 transition-all disabled:opacity-50">
                                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                    {uploading ? "Enviando..." : "Enviar Arquivo"}
                                </button>
                            </div>

                            {attachments.length === 0 ? (
                                <div className="py-10 text-center text-sage-400">
                                    <Paperclip size={36} className="mx-auto mb-3 text-sage-200 dark:text-zinc-700" />
                                    <p>Nenhum anexo enviado ainda.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {attachments.map((att: any) => (
                                        <div key={att.id} className="flex items-center justify-between rounded-2xl border border-sage-100 bg-sage-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/20">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-sage-700 dark:text-white truncate">{att.fileName}</p>
                                                    <p className="text-xs text-sage-400">{att.contentType} · {(att.fileSize / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-4">
                                                <button onClick={() => handleDownload(att.id, att.fileName)}
                                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-sage-200 text-sage-500 hover:border-brand-primary/30 hover:text-brand-primary dark:border-zinc-700 transition-all">
                                                    <Download size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteAttachment(att.id)}
                                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-sage-100 text-sage-400 hover:border-red-200 hover:text-red-500 dark:border-zinc-800 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}

function InfoItem({ icon, label, value }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage-50 text-sage-400 dark:bg-zinc-800 dark:text-zinc-500">
                {icon}</div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-sage-400">{label}</p>
                <p className="text-sm font-semibold text-sage-700 dark:text-zinc-200">{value}</p>
            </div>
        </div>
    );
}
