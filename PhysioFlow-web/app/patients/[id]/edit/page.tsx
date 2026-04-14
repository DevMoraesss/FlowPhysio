"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, User, Mail, Phone, Save, Loader2, MapPin, DollarSign, Activity, Calendar } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function EditPatientPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        fullName: "", email: "", phone: "", cpf: "",
        zipCode: "", street: "", number: "", complement: "",
        neighborhood: "", city: "", state: "",
        paymentCycle: "1", paymentDay: "",
        defaultSessionValue: "",
    });

    useEffect(() => {
        async function loadPatient() {
            try {
                const data = await apiFetch(`/patients/${id}`);
                setFormData({
                    fullName: data.fullName || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    cpf: data.cpf || "",
                    zipCode: data.zipCode || "",
                    street: data.street || "",
                    number: data.number || "",
                    complement: data.complement || "",
                    neighborhood: data.neighborhood || "",
                    city: data.city || "",
                    state: data.state || "",
                    paymentCycle: String(data.paymentCycle ?? 1),
                    paymentDay: data.paymentDay || "",
                    defaultSessionValue: data.defaultSessionValue ? String(data.defaultSessionValue) : "",
                });
            } catch (err: any) {
                setError(err.message || "Erro ao carregar paciente");
            } finally {
                setLoading(false);
            }
        }
        if (id) loadPatient();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await apiFetch(`/patients/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    fullName: formData.fullName || null,
                    email: formData.email || null,
                    phone: formData.phone || null,
                    cpf: formData.cpf || null,
                    zipCode: formData.zipCode || null,
                    street: formData.street || null,
                    number: formData.number || null,
                    complement: formData.complement || null,
                    neighborhood: formData.neighborhood || null,
                    city: formData.city || null,
                    state: formData.state || null,
                    paymentCycle: Number(formData.paymentCycle),
                    paymentDay: formData.paymentDay || null,
                    defaultSessionValue: formData.defaultSessionValue ? parseFloat(formData.defaultSessionValue) : null,
                }),
            });
            router.push(`/patients/${id}`);
        } catch (err: any) {
            setError(err.message || "Erro ao atualizar paciente");
            setSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                    <Link href={`/patients/${id}`} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-sage-200 text-sage-500 hover:bg-sage-100 dark:bg-zinc-900 dark:border-zinc-800 transition-all shadow-sm">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-sage-700 dark:text-white font-serif">Editar Cadastro</h1>
                        <p className="text-sage-500 dark:text-zinc-500 mt-1">Atualize as informações de {formData.fullName}.</p>
                    </div>
                </header>

                {error && (
                    <div className="mx-auto max-w-4xl mb-6 rounded-xl bg-red-500/10 p-4 text-sm font-medium text-red-500 border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8">

                    {/* Dados Pessoais */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                <User size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-sage-700 dark:text-white">Dados Pessoais</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputGroup label="Nome Completo *" icon={<User size={18} />}>
                                <input type="text" required name="fullName" value={formData.fullName} onChange={handleInputChange} className="wellness-input" />
                            </InputGroup>
                            <InputGroup label="CPF" icon={<User size={18} />}>
                                <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" className="wellness-input" />
                            </InputGroup>
                            <InputGroup label="Telefone" icon={<Phone size={18} />}>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(11) 99999-9999" className="wellness-input" />
                            </InputGroup>
                            <InputGroup label="Email" icon={<Mail size={18} />}>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="email@exemplo.com" className="wellness-input" />
                            </InputGroup>
                        </div>
                    </section>

                    {/* Endereço */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                <MapPin size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-sage-700 dark:text-white">Endereço</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputGroup label="CEP" icon={<MapPin size={18} />}>
                                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="00000-000" className="wellness-input" />
                            </InputGroup>
                            <InputGroup label="Cidade" icon={<MapPin size={18} />}>
                                <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="São Paulo" className="wellness-input" />
                            </InputGroup>
                            <InputGroup label="Rua / Logradouro" icon={<MapPin size={18} />}>
                                <input type="text" name="street" value={formData.street} onChange={handleInputChange} placeholder="Rua das Flores" className="wellness-input" />
                            </InputGroup>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Número" icon={<MapPin size={18} />}>
                                    <input type="text" name="number" value={formData.number} onChange={handleInputChange} placeholder="123" className="wellness-input" />
                                </InputGroup>
                                <InputGroup label="UF" icon={<MapPin size={18} />}>
                                    <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="SP" maxLength={2} className="wellness-input" />
                                </InputGroup>
                            </div>
                            <InputGroup label="Bairro" icon={<MapPin size={18} />}>
                                <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} placeholder="Centro" className="wellness-input" />
                            </InputGroup>
                            <InputGroup label="Complemento" icon={<MapPin size={18} />}>
                                <input type="text" name="complement" value={formData.complement} onChange={handleInputChange} placeholder="Apto 42, Bloco B" className="wellness-input" />
                            </InputGroup>
                        </div>
                    </section>

                    {/* Ciclo de Pagamento */}
                    <section className="rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-sage-700 dark:text-white">Pagamento</h3>
                                <p className="text-xs text-sage-400 mt-1 italic">Como esse paciente costuma pagar.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-500 dark:text-zinc-500">Ciclo</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">
                                        <Activity size={18} />
                                    </div>
                                    <select
                                        name="paymentCycle"
                                        value={formData.paymentCycle}
                                        onChange={handleInputChange}
                                        className="wellness-input"
                                    >
                                        <option value="1">Por Sessão (paga na hora)</option>
                                        <option value="2">Quinzenal</option>
                                        <option value="3">Mensal</option>
                                        <option value="4">Semanal</option>
                                    </select>
                                </div>
                            </div>

                            {formData.paymentCycle !== "1" && (
                                <InputGroup label="Dia de Pagamento" icon={<Calendar size={18} />}>
                                    <input
                                        type="text"
                                        name="paymentDay"
                                        value={formData.paymentDay}
                                        onChange={handleInputChange}
                                        placeholder='Ex: "dia 5", "toda sexta", "final do mês"'
                                        className="wellness-input"
                                    />
                                </InputGroup>
                            )}

                            <InputGroup label="Valor Padrão por Sessão (R$)" icon={<DollarSign size={18} />}>
                                <input
                                    type="number"
                                    name="defaultSessionValue"
                                    value={formData.defaultSessionValue}
                                    onChange={handleInputChange}
                                    placeholder="150,00"
                                    step="0.01"
                                    min="0"
                                    className="wellness-input"
                                />
                            </InputGroup>
                        </div>
                    </section>

                    <footer className="flex justify-end gap-4">
                        <Link href={`/patients/${id}`} className="px-8 py-4 text-sm font-bold text-sage-500 hover:text-sage-700 transition-colors">
                            Cancelar
                        </Link>
                        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-2xl bg-brand-primary px-10 py-4 font-bold text-white shadow-xl shadow-brand-primary/20 transition-all hover:bg-brand-secondary hover:translate-y-[-2px] disabled:opacity-50">
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Atualizar Cadastro
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

function InputGroup({ label, icon, children }: any) {
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
