"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { apiFetch } from "@/lib/api";
import { homeFor, clearSession } from "@/lib/session";

// Troca da própria senha, para os dois perfis. É também a única tela que abre enquanto a senha
// for provisória: a API recusa o resto até a pessoa criar a dela.

const field = "w-full rounded-md border border-linha bg-superficie px-3 py-2.5 text-base text-tinta outline-none focus:border-acao";
const label = "mb-1.5 block text-sm font-medium text-tinta-2";

type StoredUser = { role?: string; mustChangePassword?: boolean };

export default function ChangePasswordPage() {
    const router = useRouter();
    const [user, setUser] = useState<StoredUser>({});
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [repeat, setRepeat] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        try {
            setUser(JSON.parse(localStorage.getItem("physioflow_user") ?? "{}"));
        } catch {
            setUser({});
        }
    }, []);

    const provisional = user.mustChangePassword === true;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (next !== repeat) {
            setError("A nova senha e a repetição não são iguais.");
            return;
        }
        setSaving(true);
        try {
            await apiFetch("/users/me/password", {
                method: "PUT",
                body: JSON.stringify({ currentPassword: current, newPassword: next }),
            });
            localStorage.setItem("physioflow_user", JSON.stringify({ ...user, mustChangePassword: false }));
            router.push(homeFor(user.role));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Não foi possível trocar a senha.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-fundo p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-md border border-linha bg-superficie p-8">
                <div className="mb-6 flex items-center gap-3">
                    <Logo size={36} />
                    <span className="text-[17px] font-semibold text-tinta">PhysioFlow</span>
                </div>

                <h1 className="text-[22px] font-semibold text-tinta">
                    {provisional ? "Crie a sua senha" : "Trocar senha"}
                </h1>
                <p className="mt-1 mb-6 text-[15px] text-tinta-2">
                    {provisional
                        ? "A senha que você recebeu é provisória. Crie uma senha sua para continuar."
                        : "Depois de trocar, a senha antiga deixa de valer."}
                </p>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="current" className={label}>
                            {provisional ? "Senha provisória" : "Senha atual"}
                        </label>
                        <input id="current" type="password" required autoComplete="current-password"
                            value={current} onChange={e => setCurrent(e.target.value)} className={field} />
                    </div>
                    <div>
                        <label htmlFor="next" className={label}>Nova senha</label>
                        <input id="next" type="password" required autoComplete="new-password"
                            value={next} onChange={e => setNext(e.target.value)} className={field} />
                        <p className="mt-1.5 text-[13px] text-tinta-3">
                            Pelo menos 8 caracteres, com letra maiúscula, minúscula e número.
                        </p>
                    </div>
                    <div>
                        <label htmlFor="repeat" className={label}>Repita a nova senha</label>
                        <input id="repeat" type="password" required autoComplete="new-password"
                            value={repeat} onChange={e => setRepeat(e.target.value)} className={field} />
                    </div>
                </div>

                {error && <p role="alert" className="mt-4 text-[15px] text-erro">{error}</p>}

                <div className="mt-6 flex items-center justify-end gap-4">
                    {provisional && (
                        <button type="button" onClick={() => { clearSession(); router.push("/login"); }}
                            className="text-[15px] font-medium text-tinta-2 hover:underline">
                            Sair
                        </button>
                    )}
                    {!provisional && (
                        <Link href={homeFor(user.role) === "/admin" ? "/admin" : "/settings"}
                            className="text-[15px] font-medium text-tinta-2 hover:underline">
                            Cancelar
                        </Link>
                    )}
                    <button type="submit" disabled={saving}
                        className="rounded-md bg-acao px-4 py-2 text-[15px] font-medium text-white hover:bg-acao-hover disabled:opacity-60">
                        {saving ? "Salvando..." : "Salvar senha"}
                    </button>
                </div>
            </form>
        </div>
    );
}
