"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, Lock, Mail, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            localStorage.setItem("physioflow_token", data.accessToken);
            localStorage.setItem("physioflow_user", JSON.stringify(data.user));
            document.cookie = `physioflow_token=${data.accessToken}; path=/; max-age=86400`;

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Email ou senha incorretos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-sage-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-[2.5rem] border border-sage-200 bg-white p-10 wellness-shadow">

                {/* Logo */}
                <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-brand-primary text-white shadow-lg shadow-brand-primary/30">
                        <Activity size={32} />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-sage-700 font-serif">
                        PhysioFlow
                    </h2>
                    <p className="mt-2 text-sm text-sage-400">
                        Entre na sua conta para gerenciar seus pacientes
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                    {error && (
                        <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-500 border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-400">
                            Email
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-sage-400">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full rounded-[1.25rem] border border-sage-200 bg-sage-50/50 py-4 pl-11 pr-4 text-sm text-sage-700 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Senha */}
                    <div className="space-y-2">
                        <label className="ml-2 text-xs font-bold uppercase tracking-widest text-sage-400">
                            Senha
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-sage-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-[1.25rem] border border-sage-200 bg-sage-50/50 py-4 pl-11 pr-4 text-sm text-sage-700 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-2xl bg-brand-primary py-4 text-sm font-bold text-white shadow-lg shadow-brand-primary/25 transition-all hover:bg-brand-secondary hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin" size={18} />
                                Entrando...
                            </span>
                        ) : "Entrar"}
                    </button>

                    <p className="text-center text-sm text-sage-400">
                        Não tem uma conta?{" "}
                        <Link href="/register" className="font-bold text-brand-primary hover:text-brand-secondary transition-colors">
                            Criar conta
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
