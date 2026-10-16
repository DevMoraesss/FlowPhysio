"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Dialog } from "@/components/Dialog";
import { apiFetch } from "@/lib/api";

// Área do administrador. Ele gerencia quem pode entrar no sistema e não vê nenhum dado clínico:
// a API responde 403 se esta conta tentar abrir paciente, agenda ou prontuário.

type Account = {
    id: string;
    fullName: string;
    email: string;
    crefito: string | null;
    role: string;
    isActive: boolean;
};

const emptyForm = { fullName: "", email: "", crefito: "", password: "" };

const field = "w-full rounded-md border border-linha bg-superficie px-3 py-2.5 text-base text-tinta outline-none focus:border-acao";
const label = "mb-1.5 block text-sm font-medium text-tinta-2";
const primary = "rounded-md bg-acao px-4 py-2 text-[15px] font-medium text-white hover:bg-acao-hover disabled:opacity-60";
const textAction = "text-[15px] font-medium hover:underline disabled:opacity-60";

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [myId, setMyId] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    // Conta com o formulário de senha aberto, e a senha digitada
    const [resetId, setResetId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [resetError, setResetError] = useState("");

    const [notice, setNotice] = useState("");
    const [confirmDeactivate, setConfirmDeactivate] = useState<Account | null>(null);

    useEffect(() => {
        try {
            setMyId(JSON.parse(localStorage.getItem("physioflow_user") ?? "{}").id ?? "");
        } catch {
            setMyId("");
        }
        loadAccounts();
    }, []);

    async function loadAccounts() {
        setLoading(true);
        setLoadError("");
        try {
            setAccounts(await apiFetch("/admin/users"));
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : "Não foi possível carregar as contas.");
        } finally {
            setLoading(false);
        }
    }

    async function createAccount(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setFormError("");
        try {
            const created: Account = await apiFetch("/admin/users", {
                method: "POST",
                body: JSON.stringify({ ...form, crefito: form.crefito || null }),
            });
            setAccounts(prev => [...prev, created].sort((a, b) => a.fullName.localeCompare(b.fullName)));
            setNotice(`Conta criada para ${created.fullName}. Passe a senha provisória: no primeiro acesso, o sistema pede uma senha nova.`);
            setForm(emptyForm);
            setShowForm(false);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Não foi possível criar a conta.");
        } finally {
            setSaving(false);
        }
    }

    async function setActive(account: Account, active: boolean) {
        setNotice("");
        try {
            const updated: Account = await apiFetch(`/admin/users/${account.id}/${active ? "activate" : "deactivate"}`, {
                method: "PATCH",
            });
            setAccounts(prev => prev.map(a => (a.id === updated.id ? updated : a)));
            setNotice(active
                ? `${account.fullName} pode entrar de novo.`
                : `${account.fullName} não consegue mais entrar. Os dados dessa conta continuam guardados.`);
        } catch (err) {
            setNotice(err instanceof Error ? err.message : "Não foi possível mudar a situação da conta.");
        }
    }

    async function resetPassword(e: React.FormEvent, account: Account) {
        e.preventDefault();
        setResetError("");
        try {
            await apiFetch(`/admin/users/${account.id}/password`, {
                method: "PUT",
                body: JSON.stringify({ newPassword }),
            });
            setNotice(`Senha provisória definida para ${account.fullName}. No próximo acesso, o sistema pede uma senha nova.`);
            setResetId(null);
            setNewPassword("");
        } catch (err) {
            setResetError(err instanceof Error ? err.message : "Não foi possível redefinir a senha.");
        }
    }

    return (
        <div className="flex min-h-screen bg-fundo">
            <Sidebar />

            <main className="ml-64 flex-1 px-8 py-6">
                <header className="mb-6 flex items-start justify-between gap-6">
                    <div>
                        <h1 className="text-[22px] font-semibold text-tinta">Contas</h1>
                        <p className="mt-1 text-[15px] text-tinta-2">
                            Quem pode entrar no sistema. O administrador não vê pacientes nem prontuários.
                        </p>
                    </div>
                    {!showForm && (
                        <button onClick={() => { setShowForm(true); setNotice(""); }} className={primary}>
                            Nova conta
                        </button>
                    )}
                </header>

                {notice && (
                    <p role="status" className="mb-4 text-[15px] text-tinta">{notice}</p>
                )}

                {showForm && (
                    <form onSubmit={createAccount} className="mb-6 rounded-md border border-linha bg-superficie p-5">
                        <h2 className="mb-1 text-[17px] font-semibold text-tinta">Nova conta de fisioterapeuta</h2>
                        <p className="mb-4 text-sm text-tinta-3">Campos com * são obrigatórios.</p>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="fullName" className={label}>Nome completo *</label>
                                <input id="fullName" required value={form.fullName}
                                    onChange={e => setForm({ ...form, fullName: e.target.value })} className={field} />
                            </div>
                            <div>
                                <label htmlFor="email" className={label}>E-mail *</label>
                                <input id="email" type="email" required value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })} className={field} />
                            </div>
                            <div>
                                <label htmlFor="crefito" className={label}>CREFITO</label>
                                <input id="crefito" value={form.crefito}
                                    onChange={e => setForm({ ...form, crefito: e.target.value })} className={field} />
                            </div>
                            <div>
                                <label htmlFor="password" className={label}>Senha provisória *</label>
                                <input id="password" required value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })} className={field} />
                                <p className="mt-1.5 text-[13px] text-tinta-3">
                                    Pelo menos 8 caracteres, com letra maiúscula, minúscula e número. No primeiro
                                    acesso, o sistema pede uma senha nova.
                                </p>
                            </div>
                        </div>

                        {formError && <p role="alert" className="mt-4 text-[15px] text-erro">{formError}</p>}

                        <div className="mt-5 flex items-center justify-end gap-4">
                            <button type="button" onClick={() => { setShowForm(false); setFormError(""); setForm(emptyForm); }}
                                className={`${textAction} text-tinta-2`}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={saving} className={primary}>
                                {saving ? "Criando..." : "Criar conta"}
                            </button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <p className="text-[15px] text-tinta-2">Carregando contas...</p>
                ) : loadError ? (
                    <div className="rounded-md border border-linha bg-superficie p-5">
                        <p role="alert" className="text-[15px] text-erro">{loadError}</p>
                        <button onClick={loadAccounts} className={`${textAction} mt-3 text-acao`}>Tentar de novo</button>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-md border border-linha bg-superficie">
                        <table className="w-full text-left text-[15px]">
                            <thead className="border-b border-linha text-sm font-medium text-tinta-2">
                                <tr>
                                    <th className="px-3 py-2.5 font-medium">Nome</th>
                                    <th className="px-3 py-2.5 font-medium">E-mail</th>
                                    <th className="px-3 py-2.5 font-medium">CREFITO</th>
                                    <th className="px-3 py-2.5 font-medium">Perfil</th>
                                    <th className="px-3 py-2.5 font-medium">Situação</th>
                                    <th className="px-3 py-2.5"><span className="sr-only">Ações</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map(account => {
                                    const isMe = account.id === myId;
                                    const isAdmin = account.role === "Administrator";
                                    return (
                                        <Fragment key={account.id}>
                                            <tr className="border-b border-linha last:border-b-0">
                                                <td className="px-3 py-2.5 text-tinta">
                                                    {account.fullName}
                                                    {isMe && <span className="ml-2 text-[13px] text-tinta-3">(você)</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-tinta-2">{account.email}</td>
                                                <td className="px-3 py-2.5 text-tinta-2">{account.crefito}</td>
                                                <td className="px-3 py-2.5 text-tinta-2">{isAdmin ? "Administrador" : "Fisioterapeuta"}</td>
                                                <td className="px-3 py-2.5">
                                                    {account.isActive ? (
                                                        <span className="inline-flex items-center rounded bg-ok-suave px-1.5 py-0.5 text-[13px] font-medium text-ok">Ativa</span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded bg-neutra-suave px-1.5 py-0.5 text-[13px] font-medium text-neutra">Desativada</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                                    {isMe ? (
                                                        <Link href="/change-password" className={`${textAction} text-acao`}>
                                                            Trocar minha senha
                                                        </Link>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setResetId(resetId === account.id ? null : account.id); setNewPassword(""); setResetError(""); setNotice(""); }}
                                                            className={`${textAction} text-acao`}>
                                                            Redefinir senha
                                                        </button>
                                                    )}
                                                    {!isMe && (
                                                        account.isActive ? (
                                                            <button onClick={() => setConfirmDeactivate(account)}
                                                                className={`${textAction} ml-5 text-erro`}>
                                                                Desativar
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => setActive(account, true)}
                                                                className={`${textAction} ml-5 text-acao`}>
                                                                Reativar
                                                            </button>
                                                        )
                                                    )}
                                                </td>
                                            </tr>

                                            {resetId === account.id && (
                                                <tr className="border-b border-linha bg-fundo">
                                                    <td colSpan={6} className="px-3 py-4">
                                                        <form onSubmit={e => resetPassword(e, account)} className="flex flex-wrap items-end gap-4">
                                                            <div className="w-80">
                                                                <label htmlFor="newPassword" className={label}>
                                                                    Nova senha provisória para {account.fullName}
                                                                </label>
                                                                <input id="newPassword" required autoFocus value={newPassword}
                                                                    onChange={e => setNewPassword(e.target.value)} className={field} />
                                                            </div>
                                                            <button type="submit" className={primary}>Salvar senha</button>
                                                            <button type="button" onClick={() => setResetId(null)} className={`${textAction} pb-2 text-tinta-2`}>
                                                                Cancelar
                                                            </button>
                                                            <p className="basis-full text-[13px] text-tinta-3">
                                                                Pelo menos 8 caracteres, com letra maiúscula, minúscula e número. A senha antiga deixa de valer na hora, e a provisória só serve para criar uma nova.
                                                            </p>
                                                            {resetError && <p role="alert" className="basis-full text-[15px] text-erro">{resetError}</p>}
                                                        </form>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {confirmDeactivate && (
                <Dialog
                    isOpen={true}
                    title="Desativar conta"
                    message={`${confirmDeactivate.fullName} não vai mais conseguir entrar, e quem estiver conectado sai na próxima ação. Os pacientes e prontuários dessa conta continuam guardados, e dá para reativar depois.`}
                    confirmLabel="Desativar"
                    variant="danger"
                    onConfirm={() => { setActive(confirmDeactivate, false); setConfirmDeactivate(null); }}
                    onCancel={() => setConfirmDeactivate(null)}
                />
            )}
        </div>
    );
}
