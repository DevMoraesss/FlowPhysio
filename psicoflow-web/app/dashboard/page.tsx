"use client";

import { Sidebar } from "@/components/Sidebar";
import { Bell, Search, Calendar, ChevronRight, Users, Clock, Quote } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("psicoflow_user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                {/* Header */}
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Bom dia, Dr(a). {user?.name?.split(' ')[0]}</span>
                        <h1 className="mt-1 text-3xl font-bold text-sage-700 dark:text-white">Seu acolhimento hoje</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-sage-200 bg-white text-sage-500 hover:bg-sage-100 dark:border-zinc-800 dark:bg-zinc-900 transition-all">
                            <Bell size={20} />
                            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-500"></span>
                        </button>
                        <div className="relative flex h-11 w-64 items-center">
                            <Search className="absolute left-3 text-sage-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar paciente ou data..."
                                className="h-full w-full rounded-2xl border border-sage-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-brand-primary dark:border-zinc-800 dark:bg-zinc-900 transition-all"
                            />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Quote of the day (Psychologist focus) */}
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-primary/10 p-10 dark:bg-brand-primary/5">
                            <Quote className="absolute -left-4 -top-4 h-32 w-32 text-brand-primary/10 rotate-12" />
                            <div className="relative">
                                <p className="text-lg font-medium italic text-sage-700 dark:text-brand-muted">
                                    "O principal objetivo da psicoterapia não é transportar o paciente para um impossível estado de felicidade, mas sim ajudá-lo a adquirir firmeza e paciência diante do sofrimento."
                                </p>
                                <cite className="mt-4 block text-sm font-bold text-brand-primary not-italic">— Carl Jung</cite>
                            </div>
                        </div>

                        {/* Agenda Recap */}
                        <section>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-sage-700 dark:text-white">Agenda de Hoje</h3>
                                <button className="text-sm font-semibold text-brand-primary hover:underline">Ver agenda completa</button>
                            </div>
                            <div className="space-y-4">
                                <DashboardAppointment
                                    name="Maria Santos"
                                    time="14:00"
                                    type="Primeira Sessão"
                                    status="Confirmado"
                                    wellnessColor="bg-brand-primary"
                                />
                                <DashboardAppointment
                                    name="Ricardo Lima"
                                    time="15:30"
                                    type="Terapia Cognitiva"
                                    status="Em 20 min"
                                    wellnessColor="bg-sage-500"
                                />
                                <DashboardAppointment
                                    name="Ana Paula"
                                    time="17:00"
                                    type="Acompanhamento"
                                    status="Online"
                                    wellnessColor="bg-indigo-400"
                                />
                            </div>
                        </section>
                    </div>

                    {/* Right Sidebar Area */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Quick Stats */}
                        <div className="rounded-[2rem] border border-sage-200 bg-white p-6 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/50">
                            <h3 className="mb-6 font-bold text-sage-700 dark:text-white">Estatísticas Mensais</h3>
                            <div className="space-y-6">
                                <MiniStat label="Pacientes Ativos" value="24" icon={<Users size={16} />} />
                                <MiniStat label="Sessões Realizadas" value="86" icon={<Calendar size={16} />} />
                                <MiniStat label="Tempo em Sessão" value="72h" icon={<Clock size={16} />} />
                            </div>
                        </div>

                        {/* Recent Patients */}
                        <div className="rounded-[2rem] border border-sage-200 bg-white p-6 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/50">
                            <h3 className="mb-6 font-bold text-sage-700 dark:text-white">Pacientes Recentes</h3>
                            <div className="flex -space-x-3 overflow-hidden">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="inline-block h-10 w-10 rounded-2xl border-4 border-white bg-sage-200 dark:border-zinc-900 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-sage-600">
                                        P{i}
                                    </div>
                                ))}
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-white bg-brand-soft text-xs font-bold text-brand-primary dark:border-zinc-900">
                                    +3
                                </div>
                            </div>
                            <button className="mt-6 w-full rounded-2xl bg-brand-primary py-3 text-sm font-bold text-white transition-all hover:bg-brand-secondary hover:shadow-lg hover:shadow-brand-primary/20">
                                Ver todos os pacientes
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function DashboardAppointment({ name, time, type, status, wellnessColor }: any) {
    return (
        <div className="group flex items-center justify-between rounded-[2rem] border border-sage-100 bg-white p-5 transition-all hover:border-brand-primary/30 hover:shadow-md dark:border-zinc-900 dark:bg-zinc-900/40">
            <div className="flex items-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${wellnessColor} text-white font-bold`}>
                    {name.substring(0, 1).toUpperCase()}
                </div>
                <div className="ml-4">
                    <p className="font-bold text-sage-700 dark:text-white">{name}</p>
                    <p className="text-xs text-sage-400 dark:text-zinc-500">{type}</p>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="font-bold text-brand-secondary">{time}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sage-400">{status}</span>
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-50 text-sage-400 group-hover:bg-brand-primary group-hover:text-white dark:bg-zinc-800 transition-all">
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}

function MiniStat({ label, value, icon }: any) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center text-sage-500 dark:text-zinc-500">
                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-xl bg-sage-50 dark:bg-zinc-800">
                    {icon}
                </div>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <span className="text-lg font-bold text-sage-700 dark:text-white">{value}</span>
        </div>
    );
}
