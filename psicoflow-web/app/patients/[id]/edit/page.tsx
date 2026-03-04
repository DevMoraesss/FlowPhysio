"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, User, Mail, Phone, Calendar as CalendarIcon, ShieldCheck, Save, Loader2, Brain } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function EditPatientPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasResponsible, setHasResponsible] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        birthDate: "",
        cpf: "",
        // Responsible data (optional)
        responsibleName: "",
        responsibleCpf: "",
        responsiblePhone: "",
        responsibleRelation: ""
    });

    useEffect(() => {
        // Simular carregamento dos dados para edição
        setTimeout(() => {
            setFormData({
                name: "Maria Santos",
                email: "maria@example.com",
                phone: "(11) 99999-0001",
                birthDate: "1985-06-12",
                cpf: "123.456.789-00",
                responsibleName: "",
                responsibleCpf: "",
                responsiblePhone: "",
                responsibleRelation: ""
            });
            setLoading(false);
        }, 500);
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload: any = {
                name: formData.name,
                email: formData.email || null,
                phone: formData.phone || null,
                birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
                cpf: formData.cpf || null,
            };

            await apiFetch(`/patients/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
            router.push(`/patients/${id}`);
        } catch (err) {
            console.error("Erro ao atualizar:", err);
            router.push(`/patients/${id}`);
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
    </div>;

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <header className="mb-10 flex items-center gap-6">
                    <Link
                        href={`/patients/${id}`}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-sage-200 text-sage-500 hover:bg-sage-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-sage-700 dark:text-white font-serif">Editar Cadastro</h1>
                        <p className="text-sage-500 dark:text-zinc-500 mt-1">Atualize as informações de {formData.name}.</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8">
                    {/* Sessão: Dados do Paciente */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                <User size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-sage-700 dark:text-white">Dados Pessoais</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputGroup label="Nome Completo" icon={<User size={18} />}>
                                <input
                                    type="text" required name="name" value={formData.name} onChange={handleInputChange}
                                    className="wellness-input"
                                />
                            </InputGroup>

                            <InputGroup label="Email" icon={<Mail size={18} />}>
                                <input
                                    type="email" required name="email" value={formData.email} onChange={handleInputChange}
                                    className="wellness-input"
                                />
                            </InputGroup>

                            <InputGroup label="Telefone" icon={<Phone size={18} />}>
                                <input
                                    type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                                    className="wellness-input"
                                />
                            </InputGroup>

                            <InputGroup label="Data de Nascimento" icon={<CalendarIcon size={18} />}>
                                <input
                                    type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange}
                                    className="wellness-input"
                                />
                            </InputGroup>
                        </div>
                    </section>

                    {/* Sessão: Responsável (Condicional) */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40 transition-all">
                        <div className="mb-8 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-sage-700 dark:text-white">Responsável Legal</h3>
                                </div>
                            </div>

                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={hasResponsible}
                                    onChange={() => setHasResponsible(!hasResponsible)}
                                />
                                <div className="h-7 w-12 rounded-full bg-sage-200 peer-checked:bg-brand-primary transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:after:translate-x-5"></div>
                            </label>
                        </div>

                        {hasResponsible ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                <InputGroup label="Nome do Responsável">
                                    <input
                                        type="text" name="responsibleName" value={formData.responsibleName} onChange={handleInputChange}
                                        className="wellness-input"
                                    />
                                </InputGroup>
                                <InputGroup label="Vínculo / Parentesco">
                                    <select
                                        name="responsibleRelation" value={formData.responsibleRelation} onChange={handleInputChange}
                                        className="wellness-input"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="mae">Mãe</option>
                                        <option value="pai">Pai</option>
                                        <option value="avô">Avô/Avó</option>
                                        <option value="tutor">Tutor Legal</option>
                                    </select>
                                </InputGroup>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center rounded-2xl border-2 border-dashed border-sage-100 dark:border-zinc-800">
                                <p className="text-sm text-sage-400 dark:text-zinc-600 font-medium leading-relaxed">
                                    Não possui responsável vinculado.
                                </p>
                            </div>
                        )}
                    </section>

                    <footer className="flex justify-end gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-2xl bg-brand-primary px-10 py-4 font-bold text-white shadow-xl shadow-brand-primary/20 transition-all hover:bg-brand-secondary hover:translate-y-[-2px] disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Atualizar Cadastro
                        </button>
                    </footer>
                </form>
            </main>

            <style jsx global>{`
        .wellness-input {
          width: 100%;
          border-radius: 1.25rem;
          border: 1px solid #e4e9e5;
          background-color: #fdfdfc;
          padding: 1rem 1rem 1rem 3rem;
          font-size: 0.875rem;
          transition: all 0.3s;
          outline: none;
        }
        .dark .wellness-input {
          border-color: #2c3530;
          background-color: #1a201d;
          color: white;
        }
        .wellness-input:focus {
          border-color: #14b8a6;
          box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.05);
        }
      `}</style>
        </div>
    );
}

function InputGroup({ label, icon, children }: any) {
    return (
        <div className="space-y-2">
            <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500">
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">
                        {icon}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
