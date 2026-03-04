"use client";

import { Sidebar } from "@/components/Sidebar";
import {
    ArrowLeft,
    Edit3,
    Calendar,
    Clock,
    Plus,
    FileText,
    User,
    Phone,
    Mail,
    ShieldCheck,
    TrendingUp,
    History,
    MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function PatientDetailsPage() {
    const { id } = useParams();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simular carregamento de dados do paciente
        setTimeout(() => {
            setPatient({
                id,
                name: "Maria Santos",
                email: "maria@example.com",
                phone: "(11) 99999-0001",
                birthDate: "1985-06-12",
                cpf: "123.456.789-00",
                rg: "12.345.678-9",
                isMinor: false,
                address: {
                    street: "Alameda das Flores",
                    number: "123",
                    city: "São Paulo",
                    state: "SP",
                    zipCode: "01234-567"
                },
                evolutions: [
                    { id: 1, date: "2024-02-20", title: "Sessão Semanal", summary: "Paciente apresenta melhora no quadro de ansiedade...", behavior: "Calma", duration: "50min" },
                    { id: 2, date: "2024-02-13", title: "Sessão Semanal", summary: "Relatou dificuldades no ambiente de trabalho durante a semana...", behavior: "Agitada", duration: "55min" },
                    { id: 3, date: "2024-02-06", title: "Primeira Sessão (Anamnese)", summary: "Coleta de dados iniciais e estabelecimento de queixas principais...", behavior: "Reservada", duration: "60min" },
                ]
            });
            setLoading(false);
        }, 500);
    }, [id]);

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
    </div>;

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                {/* Header com Ações Rápidas */}
                <header className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/patients"
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-sage-200 text-sage-500 hover:bg-sage-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-sage-800 dark:text-white font-serif">{patient.name}</h1>
                                <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-secondary dark:bg-brand-primary/10 dark:text-brand-primary">Ativo</span>
                            </div>
                            <p className="text-sage-500 dark:text-zinc-500 mt-1">Prontuário clínico e histórico de evolução</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/patients/${id}/edit`}
                            className="flex items-center gap-2 rounded-2xl border border-sage-200 bg-white px-5 py-3 text-sm font-bold text-sage-600 hover:bg-sage-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 transition-all"
                        >
                            <Edit3 size={18} />
                            Editar Dados
                        </Link>
                        <button className="flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary hover:translate-y-[-2px] transition-all">
                            <Plus size={18} />
                            Nova Evolução
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Coluna Esquerda: Informações e Status */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Card de Informações Pessoais */}
                        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-8 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-sage-700 dark:text-white">
                                <User size={20} className="text-brand-primary" />
                                Dados do Paciente
                            </h3>

                            <div className="space-y-6">
                                <InfoItem icon={<Calendar size={16} />} label="Nascimento" value={`${new Date(patient.birthDate).toLocaleDateString()} (38 anos)`} />
                                <InfoItem icon={<FileText size={16} />} label="CPF" value={patient.cpf} />
                                <InfoItem icon={<Mail size={16} />} label="Email" value={patient.email} />
                                <InfoItem icon={<Phone size={16} />} label="Telefone" value={patient.phone} />
                                <InfoItem icon={<TrendingUp size={16} />} label="Última Sessão" value="20 de Fev, 2024" />
                            </div>

                            <div className="mt-8 pt-8 border-t border-sage-100 dark:border-zinc-800">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-sage-400 mb-4">Endereço</h4>
                                <p className="text-sm text-sage-600 dark:text-zinc-400 leading-relaxed italic">
                                    {patient.address.street}, {patient.address.number}<br />
                                    {patient.address.city}, {patient.address.state}
                                </p>
                            </div>
                        </section>

                        {/* Seção de Responsável Legal (se houver) */}
                        {patient.isMinor && (
                            <section className="rounded-[2.5rem] border border-sage-200 bg-brand-soft p-8 dark:border-zinc-800 dark:bg-brand-primary/5">
                                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-secondary dark:text-brand-primary">
                                    <ShieldCheck size={20} />
                                    Responsável Legal
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <p className="font-bold text-sage-700 dark:text-white">Carla Souza <span className="text-xs font-normal text-sage-400">(Mãe)</span></p>
                                    <p className="text-sage-500 dark:text-zinc-500 flex items-center gap-2">
                                        <Phone size={14} /> (11) 98888-7777
                                    </p>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Coluna Direita: Timeline de Evolução */}
                    <div className="lg:col-span-8">
                        <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                            <div className="mb-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-sage-700 dark:text-white font-serif">Linha do Tempo</h3>
                                    <p className="text-sage-500 mt-1">Histórico completo de atendimentos e evoluções</p>
                                </div>
                                <div className="flex bg-sage-50 rounded-2xl p-1 dark:bg-zinc-800">
                                    <button className="px-4 py-2 text-xs font-bold bg-white text-brand-primary rounded-xl shadow-sm dark:bg-zinc-700">Tudo</button>
                                    <button className="px-4 py-2 text-xs font-bold text-sage-400 hover:text-sage-600">Sessões</button>
                                    <button className="px-4 py-2 text-xs font-bold text-sage-400 hover:text-sage-600">Anexos</button>
                                </div>
                            </div>

                            <div className="relative space-y-12 before:absolute before:left-6 before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-sage-100 dark:before:bg-zinc-800">
                                {patient.evolutions?.map((evo: any, idx: number) => (
                                    <div key={evo.id} className="relative pl-16 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                                        {/* Marcador da Timeline */}
                                        <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-white border-4 border-sage-50 text-brand-primary wellness-shadow dark:bg-zinc-900 dark:border-zinc-950">
                                            {idx === 0 ? <TrendingUp size={20} /> : <History size={20} />}
                                        </div>

                                        <div className="group rounded-[2rem] border border-sage-50 bg-sage-50/30 p-8 transition-all hover:bg-white hover:border-brand-primary/20 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/40">
                                            <div className="mb-4 flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">{new Date(evo.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                                    <h4 className="text-xl font-bold text-sage-700 dark:text-white mt-1 group-hover:text-brand-secondary transition-colors">{evo.title}</h4>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-bold text-sage-400">
                                                    <span className="flex items-center gap-1"><Clock size={14} /> {evo.duration}</span>
                                                    <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 dark:bg-zinc-800"><MessageSquare size={14} /> {evo.behavior}</span>
                                                </div>
                                            </div>

                                            <p className="text-sage-600 dark:text-zinc-400 leading-relaxed">
                                                {evo.summary}
                                            </p>

                                            <div className="mt-6 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-xs font-bold text-sage-400 hover:text-brand-primary">Expandir Detalhes</button>
                                                <button className="rounded-xl bg-white p-2 text-sage-400 hover:text-brand-primary shadow-sm dark:bg-zinc-800">
                                                    <Edit3 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

function InfoItem({ icon, label, value }: any) {
    return (
        <div className="flex items-center">
            <div className="mr-4 flex h-9 w-9 items-center justify-center rounded-xl bg-sage-50 text-sage-400 dark:bg-zinc-800 dark:text-zinc-500">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-sage-400">{label}</p>
                <p className="text-sm font-semibold text-sage-700 dark:text-zinc-200">{value}</p>
            </div>
        </div>
    );
}
