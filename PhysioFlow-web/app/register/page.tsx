"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, User, Mail, Lock, Loader2, Phone } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await apiFetch("/auth/register", {
                method: "POST",
                body: JSON.stringify({ fullName, email, password, phone }),
            });

            router.push("/login?registered=true");
        } catch (err: any) {
            setError(err.message || "Erro ao criar conta");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-xl">
                <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                        <Brain size={28} />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Criar conta</h2>
                    <p className="mt-2 text-sm text-zinc-400">Junte-se ao PhysioFlow e comece a gerenciar sua clínica</p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                    {error && (
                        <div className="rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-500 border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-300 ml-1">Nome Completo</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 pl-10 pr-3 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="Nome completo"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-300 ml-1">Email</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 pl-10 pr-3 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-300 ml-1">Telefone</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                                    <Phone size={18} />
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 pl-10 pr-3 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-300 ml-1">Senha</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 pl-10 pr-3 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Criar Conta"}
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-zinc-400">
                            Já tem uma conta?{" "}
                            <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                                Entrar
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
