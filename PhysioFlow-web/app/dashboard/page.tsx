"use client";

import { Sidebar } from "@/components/Sidebar";
import { Bell, Calendar, CheckCircle, XCircle, DollarSign, Clock, UserPlus, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [dashboard, setDashboard] = useState<any>(null);
    const [noShows, setNoShows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("physioflow_user");
        if (storedUser) setUser(JSON.parse(storedUser));

        async function load() {
            try {
                const [dash, ns] = await Promise.all([
                    apiFetch("/dashboard"),
                    apiFetch("/dashboard/no-shows"),
                ]);
                setDashboard(dash);
                setNoShows(ns);
            } catch (err) {
                console.error("Erro ao carregar dashboard:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    const STATUS_BADGE: Record<number, string> = {
        1: "bg-brand-soft text-brand-primary",
        2: "bg-green-100 text-green-600",
        3: "bg-red-100 text-red-500",
        4: "bg-zinc-100 text-zinc-400",
    };
    const STATUS_LABEL: Record<number, string> = {
        1: "Agendado", 2: "Concluído", 3: "Faltou", 4: "Cancelado",
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                {/* Header */}
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">
                            {greeting}, {user?.fullName?.split(" ")[0] || "Fisioterapeuta"}
                        </span>
                        <h1 className="mt-1 text-3xl font-bold text-sage-700 dark:text-white font-serif">Painel do Dia</h1>
                    </div>
                    <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-sage-200 bg-white text-sage-500 hover:bg-sage-100 dark:border-zinc-800 dark:bg-zinc-900 transition-all">
                        <Bell size={20} />
                    </button>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Cards de estatísticas */}
                        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                            <StatCard label="Agendamentos" value={dashboard?.totalAppointments ?? 0} icon={<Calendar size={20} />} color="text-brand-primary" />
                            <StatCard label="Concluídos" value={dashboard?.completed ?? 0} icon={<CheckCircle size={20} />} color="text-green-500" />
                            <StatCard label="Faltas / Cancelados" value={(dashboard?.noShow ?? 0) + (dashboard?.cancelled ?? 0)} icon={<XCircle size={20} />} color="text-red-400" />
                            <StatCard
                                label="Receita do Dia"
                                value={`R$ ${(dashboard?.totalRevenue ?? 0).toFixed(2).replace(".", ",")}`}
                                icon={<DollarSign size={20} />}
                                color="text-emerald-500"
                            />
                        </div>

                        {/* Ações rápidas */}
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/schedule/new"
                                className="flex items-center gap-4 rounded-[2rem] border border-sage-200 bg-white p-6 hover:border-brand-primary hover:shadow-lg hover:shadow-brand-primary/5 transition-all wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40 group">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10 group-hover:scale-105 transition-transform">
                                    <Calendar size={22} />
                                </div>
                                <div>
                                    <p className="font-bold text-sage-700 dark:text-white">Novo Agendamento</p>
                                    <p className="text-xs text-sage-400 mt-0.5">Marcar nova sessão</p>
                                </div>
                                <ChevronRight size={18} className="ml-auto text-sage-300 group-hover:text-brand-primary transition-colors" />
                            </Link>
                            <Link href="/patients/new"
                                className="flex items-center gap-4 rounded-[2rem] border border-sage-200 bg-white p-6 hover:border-brand-primary hover:shadow-lg hover:shadow-brand-primary/5 transition-all wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40 group">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10 group-hover:scale-105 transition-transform">
                                    <UserPlus size={22} />
                                </div>
                                <div>
                                    <p className="font-bold text-sage-700 dark:text-white">Cadastrar Paciente</p>
                                    <p className="text-xs text-sage-400 mt-0.5">Adicionar novo paciente</p>
                                </div>
                                <ChevronRight size={18} className="ml-auto text-sage-300 group-hover:text-brand-primary transition-colors" />
                            </Link>
                        </div>

                        {/* Agenda do dia */}
                        <section>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-sage-700 dark:text-white">Agenda de Hoje</h3>
                                <Link href="/schedule" className="text-sm font-medium text-brand-primary hover:underline">Ver agenda completa</Link>
                            </div>

                            {!dashboard?.appointments?.length ? (
                                <div className="rounded-[2rem] border border-sage-200 bg-white p-10 text-center text-sage-400 dark:border-zinc-900 dark:bg-zinc-900/40">
                                    Nenhum agendamento para hoje.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {dashboard.appointments.map((appt: any) => (
                                        <Link key={appt.id} href={`/patients/${appt.patientId}`}
                                            className="flex items-center justify-between rounded-[2rem] border border-sage-100 bg-white p-5 hover:border-brand-primary/30 hover:shadow-sm transition-all dark:border-zinc-900 dark:bg-zinc-900/40 group">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                                    <Clock size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sage-700 dark:text-white group-hover:text-brand-primary transition-colors">
                                                        {appt.patientName ?? "Paciente"}
                                                    </p>
                                                    <p className="text-xs text-sage-400">
                                                        {formatTime(appt.startDateTime)} – {formatTime(appt.endDateTime)}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[appt.status] ?? "bg-zinc-100 text-zinc-400"}`}>
                                                {STATUS_LABEL[appt.status] ?? "—"}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Pacientes que faltaram e não remarcaram */}
                        {noShows.length > 0 && (
<section>
                                <div className="mb-4 flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-amber-500" />
                                    <h3 className="text-xl font-bold text-sage-700 dark:text-white">Faltaram e não remarcaram</h3>
                                </div>
                                <div className="space-y-3">
                                    {noShows.map((ns: any) => (
                                        <div 
                                            key={ns.patientId} 
                                            className="flex items-center justify-between rounded-[2rem] border border-amber-100 bg-white p-5 hover:border-amber-300 transition-all dark:border-amber-500/20 dark:bg-zinc-900/40"
                                        >
                                            <Link href={`/patients/${ns.patientId}`} className="flex items-center gap-4 flex-1">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
                                                    <AlertTriangle size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sage-700 dark:text-white">{ns.patientName}</p>
                                                    <p className="text-xs text-sage-400">Última falta: {formatDate(ns.lastNoShowDate)}</p>
                                                </div>
                                            </Link>
                                            <Link 
                                                href={`/schedule/new?patientId=${ns.patientId}`}
                                                className="rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-100 transition-colors dark:bg-amber-500/10 dark:text-amber-400"
                                            >
                                                Remarcar
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <div className="rounded-[2rem] border border-sage-200 bg-white p-6 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/50">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-50 dark:bg-zinc-800 ${color}`}>
                {icon}
            </div>
            <p className="text-2xl font-bold text-sage-700 dark:text-white">{value}</p>
            <p className="mt-1 text-sm text-sage-400 dark:text-zinc-500">{label}</p>
        </div>
    );
}
