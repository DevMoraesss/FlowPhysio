"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    Users,
    Calendar,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Activity,
    ChevronRight,
    Settings,
    Bell,
    DollarSign
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("physioflow_user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    const handleLogout = () => {
        // Apaga do localStorage
        localStorage.removeItem("physioflow_token");
        localStorage.removeItem("physioflow_user");

        // Apaga o cookie (max-age=0 faz expirar imediatamente)
        document.cookie = "physioflow_token=; path=/; max-age=0";

        router.push("/login");
    };


    const navItems = [
        { icon: <LayoutDashboard size={20} />, label: "Início", href: "/dashboard" },
        { icon: <Users size={20} />, label: "Pacientes", href: "/patients" },
        { icon: <Calendar size={20} />, label: "Agenda", href: "/schedule" },
        { icon: <ClipboardList size={20} />, label: "Prontuários", href: "/records" },
        { icon: <DollarSign size={20} />, label: "Pagamentos", href: "/payments" },
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sage-200 bg-white dark:bg-zinc-950 dark:border-zinc-900 transition-all duration-300">
            <div className="flex h-full flex-col px-4 py-6">
                <div className="mb-10 flex items-center px-2">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
                        <Activity size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-sage-700 dark:text-white">PhysioFlow</span>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group flex items-center rounded-2xl p-3 text-sm font-medium transition-all hover:bg-sage-100 dark:hover:bg-zinc-900 ${isActive
                                        ? "bg-brand-soft text-brand-secondary dark:bg-brand-primary/10 dark:text-brand-primary"
                                        : "text-sage-500 hover:text-sage-700 dark:text-zinc-400 dark:hover:text-white"
                                    }`}
                            >
                                <div className={isActive ? "text-brand-primary" : "text-sage-400 group-hover:text-sage-600 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors"}>
                                    {item.icon}
                                </div>
                                <span className="ml-3">{item.label}</span>
                                {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(20,184,166,0.6)]" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto border-t border-sage-100 dark:border-zinc-900 pt-6">
                    <div className="mb-6 flex items-center px-2">
                        <div className="h-10 w-10 rounded-2xl bg-sage-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-sage-600 dark:text-zinc-400 overflow-hidden border-2 border-white dark:border-zinc-900">
                            {user?.fullName?.substring(0, 2).toUpperCase() || "??"}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="truncate text-sm font-semibold text-sage-700 dark:text-white">{user?.fullName || "Fisioterapeuta"}</p>
                            <p className="truncate text-xs text-sage-500 dark:text-zinc-500 italic">Fisioterapeuta</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Link
                            href="/settings"
                            className="flex items-center justify-center rounded-xl p-2.5 text-sage-500 hover:bg-sage-100 hover:text-sage-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-300 transition-all"
                        >
                            <Settings size={20} />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center rounded-xl p-2.5 text-sage-500 hover:bg-red-50 hover:text-red-500 dark:text-zinc-500 dark:hover:bg-red-500/10 dark:hover:text-red-500 transition-all"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
