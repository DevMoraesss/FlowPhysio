"use client";

import { Sidebar } from "@/components/Sidebar";
import { Dialog } from "@/components/Dialog";
import { Search, Plus, Filter, MoreHorizontal, Phone, Mail, User as UserIcon, ClipboardList, Pencil, UserX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api";

export default function PatientsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function loadPatients() {
            try {
                const data = await apiFetch("/patients");
                setPatients(data.filter((p: any) => p.isActive !== false));
            } catch (err) {
                console.error("Erro ao carregar pacientes:", err);
            } finally {
                setLoading(false);
            }
        }
        loadPatients();
    }, []);

    const handlePatientInactivated = (patientId: string) => {
        setPatients(prev => prev.filter(p => p.id !== patientId));
    };

    const filteredPatients = patients.filter(p =>
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-sage-700 dark:text-white font-serif">Meus Pacientes</h1>
                        <p className="text-sage-500 dark:text-zinc-500 mt-1">Gerencie o histórico e acompanhamento dos seus pacientes.</p>
                    </div>
                    <Link
                        href="/patients/new"
                        className="flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-3 font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-secondary hover:translate-y-[-2px]"
                    >
                        <Plus size={20} />
                        Novo Paciente
                    </Link>
                </header>

                <div className="mb-8 flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-[2rem] border border-sage-200 bg-white py-4 pl-12 pr-6 outline-none focus:border-brand-primary wellness-shadow dark:border-zinc-800 dark:bg-zinc-900 transition-all"
                        />
                    </div>
                    <button className="flex h-14 items-center gap-2 rounded-[2rem] border border-sage-200 bg-white px-6 font-semibold text-sage-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 transition-all hover:bg-sage-100">
                        <Filter size={20} />
                        Filtros
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center text-sage-400">Carregando pacientes...</div>
                    ) : filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                            <PatientCard key={patient.id} patient={patient} onInactivate={handlePatientInactivated} />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-sage-400">Nenhum paciente encontrado.</div>
                    )}
                </div>
            </main>
        </div>
    );
}

function PatientCard({ patient, onInactivate }: { patient: any; onInactivate: (id: string) => void }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [inactivating, setInactivating] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const calculateAge = (dateStr: string) => {
        if (!dateStr) return "?";
        try {
            const birth = new Date(dateStr + "T12:00:00");
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
            return age;
        } catch {
            return "?";
        }
    };

    const handleInactivate = async () => {
        setInactivating(true);
        try {
            await apiFetch(`/patients/${patient.id}/deactivate`, { method: "PATCH" });
            onInactivate(patient.id);
        } catch {
            setInactivating(false);
            setDialogOpen(false);
        }
    };

    return (
        <div className="group relative overflow-hidden rounded-[2.5rem] border border-sage-200 bg-white p-6 transition-all hover:border-brand-primary/40 hover:shadow-xl wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
            <div className="flex items-start justify-between">
                <div className="flex items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-brand-soft text-2xl font-bold text-brand-primary dark:bg-brand-primary/10 transition-transform group-hover:scale-110">
                        {patient.fullName?.substring(0, 1).toUpperCase() || "?"}
                    </div>
                    <div className="ml-4">
                        <h4 className="text-lg font-bold text-sage-800 dark:text-white leading-tight">{patient.fullName || "Paciente sem nome"}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-sage-400 dark:text-zinc-500">
                                {calculateAge(patient.birthDate)} anos
                            </span>
                            {Number(calculateAge(patient.birthDate)) < 18 ? (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-500">
                                    MENOR
                                </span>
                            ) : patient.guardianId ? (
                                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand-primary dark:bg-brand-primary/10">
                                    COM RESPONSÁVEL
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Menu 3 pontinhos */}
                <div ref={menuRef} className="relative">
                    <button
                        onClick={() => setMenuOpen(prev => !prev)}
                        className="rounded-xl p-2 text-sage-300 hover:bg-sage-50 hover:text-sage-600 dark:text-zinc-600 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <MoreHorizontal size={20} />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-full z-40 mt-1 w-52 overflow-hidden rounded-2xl border border-sage-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                            <Link
                                href={`/patients/${patient.id}`}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-5 py-3 text-sm text-sage-700 hover:bg-brand-soft hover:text-brand-primary dark:text-zinc-300 dark:hover:bg-brand-primary/10 dark:hover:text-brand-primary transition-colors"
                            >
                                <ClipboardList size={15} />
                                Ver Prontuário
                            </Link>
                            <Link
                                href={`/patients/${patient.id}/edit`}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-3 px-5 py-3 text-sm text-sage-700 hover:bg-brand-soft hover:text-brand-primary dark:text-zinc-300 dark:hover:bg-brand-primary/10 dark:hover:text-brand-primary transition-colors"
                            >
                                <Pencil size={15} />
                                Editar Cadastro
                            </Link>
                            <div className="mx-5 my-1 h-px bg-sage-100 dark:bg-zinc-800" />
                            <button
                                onClick={() => { setMenuOpen(false); setDialogOpen(true); }}
                                className="flex w-full items-center gap-3 px-5 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            >
                                <UserX size={15} />
                                Inativar Paciente
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 space-y-4">
                <div className="flex items-center text-sm text-sage-500 dark:text-zinc-400">
                    <Mail size={16} className="mr-3 text-brand-primary/60" />
                    <span className="truncate">{patient.email || "Sem email cadastrado"}</span>
                </div>
                <div className="flex items-center text-sm text-sage-500 dark:text-zinc-400">
                    <Phone size={16} className="mr-3 text-brand-primary/60" />
                    <span>{patient.phone || "Sem telefone"}</span>
                </div>
                {patient.guardianId && (
                    <div className="flex items-center text-sm text-brand-primary dark:text-brand-primary/80">
                        <UserIcon size={16} className="mr-3 opacity-60" />
                        <span className="font-medium">Possui responsável legal</span>
                    </div>
                )}
            </div>

            <div className="mt-8 flex gap-3">
                <Link
                    href={`/patients/${patient.id}`}
                    className="flex-1 rounded-2xl bg-sage-50 py-3 text-center text-xs font-bold text-sage-600 transition-all hover:bg-sage-100 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                    Ver Prontuário
                </Link>
                <Link
                    href={`/patients/${patient.id}/edit`}
                    className="rounded-2xl border border-sage-100 px-4 py-3 text-sage-400 transition-all hover:border-brand-primary/20 hover:text-brand-primary dark:border-zinc-800 dark:hover:border-brand-primary/30"
                >
                    Editar
                </Link>
            </div>

            <Dialog
                isOpen={dialogOpen}
                title="Inativar Paciente"
                message={`Tem certeza que deseja inativar ${patient.fullName}? O paciente ficará oculto nos agendamentos, mas o histórico completo será mantido.`}
                confirmLabel={inactivating ? "Inativando..." : "Inativar"}
                cancelLabel="Cancelar"
                variant="warning"
                onConfirm={handleInactivate}
                onCancel={() => setDialogOpen(false)}
            />
        </div>
    );
}
