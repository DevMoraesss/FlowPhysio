"use client";

import { Sidebar } from "@/components/Sidebar";
import { Search, FileText, Clock, Activity, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function RecordsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [evolutions, setEvolutions] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const patientsData = await apiFetch("/patients");
                setPatients(patientsData);

                // Busca evoluções de cada paciente em paralelo
                const evolutionsMap: Record<string, any[]> = {};
                await Promise.all(
                    patientsData.map(async (patient: any) => {
                        try {
                            const evo = await apiFetch(`/evolutions/patient/${patient.id}`);
                            evolutionsMap[patient.id] = evo;
                        } catch {
                            evolutionsMap[patient.id] = [];
                        }
                    })
                );
                setEvolutions(evolutionsMap);
            } catch (err) {
                console.error("Erro ao carregar prontuários:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const filtered = patients.filter((p) =>
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pega a data da última evolução de um paciente
    const getLastEvolution = (patientId: string) => {
        const evo = evolutions[patientId];
        if (!evo || evo.length === 0) return null;
        // Ordena do mais recente para o mais antigo e pega o primeiro
        return evo.sort(
            (a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-sage-700 dark:text-white font-serif">
                        Prontuários
                    </h1>
                    <p className="text-sage-500 dark:text-zinc-500 mt-1">
                        Histórico clínico e evoluções dos pacientes.
                    </p>
                </header>

                {/* Busca */}
                <div className="mb-8 relative">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400"
                        size={20}
                    />
                    <input
                        type="text"
                        placeholder="Buscar paciente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-[2rem] border border-sage-200 bg-white py-4 pl-12 pr-6 outline-none focus:border-brand-primary wellness-shadow dark:border-zinc-800 dark:bg-zinc-900 transition-all"
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center text-sage-400">
                        Nenhum paciente encontrado.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((patient) => {
                            const lastEvo = getLastEvolution(patient.id);
                            const totalEvolutions = evolutions[patient.id]?.length ?? 0;

                            return (
                                <Link
                                    key={patient.id}
                                    href={`/patients/${patient.id}`}
                                    className="flex items-center justify-between rounded-[2rem] border border-sage-100 bg-white p-6 transition-all hover:border-brand-primary/30 hover:shadow-lg wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40 dark:hover:border-brand-primary/20"
                                >
                                    {/* Avatar + nome */}
                                    <div className="flex items-center gap-5">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-brand-soft text-xl font-bold text-brand-primary dark:bg-brand-primary/10">
                                            {patient.fullName?.substring(0, 1).toUpperCase() || "?"}
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-sage-800 dark:text-white">
                                                {patient.fullName}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {patient.isActive ? (
                                                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand-secondary dark:bg-brand-primary/10 dark:text-brand-primary">
                                                        Ativo
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-500">
                                                        Inativo
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats clínicas */}
                                    <div className="flex items-center gap-10">
                                        <div className="flex items-center gap-2 text-sage-500 dark:text-zinc-400">
                                            <Activity size={16} className="text-brand-primary/60" />
                                            <div>
                                                <p className="text-xs text-sage-400 dark:text-zinc-500">Evoluções</p>
                                                <p className="text-sm font-bold text-sage-700 dark:text-white">
                                                    {totalEvolutions}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-sage-500 dark:text-zinc-400">
                                            <Clock size={16} className="text-brand-primary/60" />
                                            <div>
                                                <p className="text-xs text-sage-400 dark:text-zinc-500">Última sessão</p>
                                                <p className="text-sm font-bold text-sage-700 dark:text-white">
                                                    {lastEvo ? formatDate(lastEvo.createdAt) : "—"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-sage-500 dark:text-zinc-400">
                                            <FileText size={16} className="text-brand-primary/60" />
                                            <div>
                                                <p className="text-xs text-sage-400 dark:text-zinc-500">Última anotação</p>
                                                <p className="text-sm font-bold text-sage-700 dark:text-white max-w-[200px] truncate">
                                                    {lastEvo?.clinicalNotes
                                                        ? lastEvo.clinicalNotes.substring(0, 40) + "..."
                                                        : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <ChevronRight size={20} className="text-sage-300 dark:text-zinc-600" />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
