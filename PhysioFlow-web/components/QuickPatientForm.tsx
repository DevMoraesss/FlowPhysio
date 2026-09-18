"use client";

import { useEffect, useState } from "react";
import { User, Phone, Loader2, UserPlus, X, AlertTriangle, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface QuickPatientFormProps {
    /** Chamado com o paciente recém-criado (pré-cadastro). */
    onCreated: (patient: any) => void;
    /** Chamado quando a fisioterapeuta reconhece um paciente que já existe. */
    onSelectExisting: (patientId: string) => void;
    onCancel: () => void;
}

/**
 * Pré-cadastro feito durante o telefonema: só nome e telefone.
 *
 * Decisões de interface, pensadas para uma usuária de 50 anos com pouca
 * familiaridade com sistemas:
 *   - rótulo VISÍVEL acima de cada campo, não só placeholder - placeholder
 *     some quando a pessoa começa a digitar e ela perde a referência;
 *   - texto em tamanho normal (14-16px), nada de letra miúda;
 *   - alvos de clique grandes;
 *   - a linguagem descreve a ação ("Cadastrar e marcar a consulta"), não o
 *     conceito técnico ("criar pré-cadastro").
 *
 * A parte mais importante não é o formulário - é a BUSCA. Enquanto ela digita,
 * o componente procura pacientes parecidos e mostra antes de deixar criar.
 * Sem isso, a mesma paciente viraria três cadastros ao longo dos meses.
 */
export function QuickPatientForm({ onCreated, onSelectExisting, onCancel }: QuickPatientFormProps) {
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [similar, setSimilar] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // Busca com atraso de 400ms ("debounce"): espera a pessoa parar de digitar
    // em vez de disparar uma requisição por tecla.
    useEffect(() => {
        const term = fullName.trim().length >= 3 ? fullName.trim() : phone.replace(/\D/g, "");
        if (term.length < 3) {
            setSimilar([]);
            return;
        }

        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                const found = await apiFetch(`/patients/search?term=${encodeURIComponent(term)}`);
                setSimilar(Array.isArray(found) ? found : []);
            } catch {
                setSimilar([]);
            } finally {
                setSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [fullName, phone]);

    const handleCreate = async () => {
        if (!fullName.trim()) return setError("Escreva o nome do paciente");
        if (!phone.trim()) return setError("Escreva o telefone - é por ele que você vai retornar o contato");

        setSaving(true);
        setError("");
        try {
            const created = await apiFetch("/patients/quick", {
                method: "POST",
                body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() }),
            });
            onCreated(created);
        } catch (err: any) {
            setError(err.message || "Não foi possível cadastrar. Tente novamente.");
        } finally {
            setSaving(false);
        }
    };

    const podeCriar = fullName.trim() !== "" && phone.trim() !== "";

    return (
        <div className="rounded-2xl border border-brand-primary/40 bg-brand-soft/30 p-5 dark:border-brand-primary/25 dark:bg-brand-primary/5">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm shadow-brand-primary/30">
                        <UserPlus size={19} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-sage-800 dark:text-white">
                            Cadastrar paciente novo
                        </h4>
                        <p className="mt-0.5 text-xs text-sage-500 dark:text-zinc-400">
                            Só o nome e o telefone por enquanto
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onCancel}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sage-400 transition-all hover:bg-sage-100 hover:text-sage-700 dark:hover:bg-zinc-800 dark:hover:text-white"
                    aria-label="Fechar cadastro de paciente novo"
                    title="Fechar"
                >
                    <X size={17} />
                </button>
            </div>

            {error && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-500/10">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="quick-nome" className="ml-1 block text-xs font-bold text-sage-600 dark:text-zinc-300">
                        Nome do paciente
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">
                            <User size={18} />
                        </div>
                        <input
                            id="quick-nome"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ex: Maria Aparecida Souza"
                            autoComplete="off"
                            className="wellness-input"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="quick-telefone" className="ml-1 block text-xs font-bold text-sage-600 dark:text-zinc-300">
                        Telefone
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">
                            <Phone size={18} />
                        </div>
                        <input
                            id="quick-telefone"
                            type="tel"
                            inputMode="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ex: (11) 98765-4321"
                            autoComplete="off"
                            className="wellness-input"
                        />
                    </div>
                </div>
            </div>

            {/* Pacientes parecidos - o que impede duplicar cadastro */}
            {searching && (
                <p className="mt-3 flex items-center gap-2 text-xs text-sage-400">
                    <Loader2 size={12} className="animate-spin" />
                    Verificando se já existe...
                </p>
            )}

            {!searching && similar.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 dark:border-amber-500/40 dark:bg-amber-500/10">
                    <div className="mb-2.5 flex items-start gap-2">
                        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                        <div>
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-400">
                                Já existe alguém parecido
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400/80">
                                Se for a mesma pessoa, clique no nome abaixo para usar o cadastro
                                que já existe.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        {similar.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => onSelectExisting(p.id)}
                                className="flex w-full items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-left transition-all hover:border-amber-400 hover:bg-amber-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-bold text-sage-800 dark:text-white">
                                        {p.fullName}
                                    </p>
                                    <p className="mt-0.5 text-xs text-sage-500 dark:text-zinc-400">
                                        {p.phone || p.cpf || "sem telefone cadastrado"}
                                        {!p.isActive && " - inativo"}
                                    </p>
                                </div>
                                <span className="flex shrink-0 items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                                    <Check size={12} />
                                    É esta
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !podeCriar}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 text-sm font-bold text-white shadow-sm shadow-brand-primary/25 transition-all hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
                {saving ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
                {similar.length > 0 ? "Não é nenhuma dessas - cadastrar nova" : "Cadastrar e marcar a consulta"}
            </button>

            {!podeCriar && (
                <p className="mt-2.5 text-center text-xs text-sage-400 dark:text-zinc-500">
                    Preencha o nome e o telefone para continuar
                </p>
            )}
        </div>
    );
}
