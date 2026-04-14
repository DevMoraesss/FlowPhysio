"use client";

import { Sidebar } from "@/components/Sidebar";
import { User, Mail, Phone, FileText, Save, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        cpf: "",
        crefito: "",
    });

    const [email, setEmail] = useState(""); // só exibe, não edita

    useEffect(() => {
        async function loadUser() {
            try {
                const data = await apiFetch("/users/me");
                setEmail(data.email);
                setFormData({
                    fullName: data.fullName || "",
                    phone: data.phone || "",
                    cpf: data.cpf || "",
                    crefito: data.crefito || "",
                });
            } catch (err: any) {
                setError(err.message || "Erro ao carregar perfil");
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            const updated = await apiFetch("/users/me", {
                method: "PUT",
                body: JSON.stringify({
                    fullName: formData.fullName || null,
                    phone: formData.phone || null,
                    cpf: formData.cpf || null,
                    crefito: formData.crefito || null,
                }),
            });

            // Atualiza o nome no localStorage para a sidebar refletir
            const stored = localStorage.getItem("physioflow_user");
            if (stored) {
                const user = JSON.parse(stored);
                user.fullName = updated.fullName;
                localStorage.setItem("physioflow_user", JSON.stringify(user));
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Erro ao salvar");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-zinc-950">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <header className="mb-10 flex items-center gap-6">
                    <Link
                        href="/dashboard"
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-sage-200 text-sage-500 hover:bg-sage-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-sage-700 dark:text-white font-serif">Configurações</h1>
                        <p className="text-sage-500 dark:text-zinc-500 mt-1">Gerencie seu perfil profissional.</p>
                    </div>
                </header>

                {error && (
                    <div className="mx-auto max-w-2xl mb-6 rounded-xl bg-red-500/10 p-4 text-sm font-medium text-red-500 border border-red-500/20">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mx-auto max-w-2xl mb-6 rounded-xl bg-green-500/10 p-4 text-sm font-medium text-green-600 border border-green-500/20">
                        Perfil atualizado com sucesso!
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8">
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                <User size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-sage-700 dark:text-white">Dados Profissionais</h3>
                        </div>

                        <div className="space-y-6">

                            {/* Email — só leitura */}
                            <div className="space-y-2">
                                <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500">
                                    Email (não editável)
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-300">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        className="w-full rounded-[1.25rem] border border-sage-100 bg-sage-50 px-4 py-4 pl-11 text-sm text-sage-400 outline-none cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-600"
                                    />
                                </div>
                            </div>

                            <Field label="Nome Completo *" icon={<User size={18} />}>
                                <input
                                    type="text" required name="fullName"
                                    value={formData.fullName} onChange={handleChange}
                                    placeholder="Dra. Maria Santos"
                                    className="wellness-input"
                                />
                            </Field>

                            <Field label="Telefone" icon={<Phone size={18} />}>
                                <input
                                    type="tel" name="phone"
                                    value={formData.phone} onChange={handleChange}
                                    placeholder="(11) 99999-9999"
                                    className="wellness-input"
                                />
                            </Field>

                            <Field label="CPF" icon={<FileText size={18} />}>
                                <input
                                    type="text" name="cpf"
                                    value={formData.cpf} onChange={handleChange}
                                    placeholder="000.000.000-00"
                                    className="wellness-input"
                                />
                            </Field>

                            <Field label="CREFITO" icon={<FileText size={18} />}>
                                <input
                                    type="text" name="crefito"
                                    value={formData.crefito} onChange={handleChange}
                                    placeholder="CREFITO-3/12345-F"
                                    className="wellness-input"
                                />
                            </Field>
                        </div>
                    </section>

                    <footer className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-2xl bg-brand-primary px-10 py-4 font-bold text-white shadow-xl shadow-brand-primary/20 transition-all hover:bg-brand-secondary hover:translate-y-[-2px] disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Salvar Alterações
                        </button>
                    </footer>
                </form>
            </main>

            <style jsx global>{`
                .wellness-input { width: 100%; border-radius: 1.25rem; border: 1px solid #e4e9e5; background-color: #fdfdfc; padding: 1rem 1rem 1rem 3rem; font-size: 0.875rem; transition: all 0.3s; outline: none; }
                .dark .wellness-input { border-color: #2c3530; background-color: #1a201d; color: white; }
                .wellness-input:focus { border-color: #14b8a6; box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.05); }
            `}</style>
        </div>
    );
}

function Field({ label, icon, children }: any) {
    return (
        <div className="space-y-2">
            <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-400 dark:text-zinc-500">{label}</label>
            <div className="relative">
                {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">{icon}</div>}
                {children}
            </div>
        </div>
    );
}
