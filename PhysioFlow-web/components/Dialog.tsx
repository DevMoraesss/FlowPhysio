"use client";

import { X } from "lucide-react";

interface DialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "default";
    onConfirm: () => void;
    onCancel?: () => void; // sem onCancel = modo alerta (só botão OK)
}

export function Dialog({
    isOpen,
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "default",
    onConfirm,
    onCancel,
}: DialogProps) {
    if (!isOpen) return null;

    const confirmColors = {
        danger:  "bg-red-500 hover:bg-red-600 shadow-red-500/20",
        warning: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
        default: "bg-brand-primary hover:bg-brand-secondary shadow-brand-primary/20",
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl dark:bg-zinc-900 border border-sage-200 dark:border-zinc-800">

                <div className="flex items-start justify-between mb-3">
                    <h2 className="text-lg font-bold text-sage-800 dark:text-white font-serif">
                        {title}
                    </h2>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="rounded-full p-1 text-sage-400 hover:bg-sage-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <p className="text-sm text-sage-500 dark:text-zinc-400 mb-8 leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="flex-1 rounded-2xl border border-sage-200 dark:border-zinc-700 py-3 text-sm font-bold text-sage-600 dark:text-zinc-400 hover:bg-sage-50 dark:hover:bg-zinc-800 transition-all"
                        >
                            {cancelLabel}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white shadow-lg transition-all hover:translate-y-[-1px] ${confirmColors[variant]}`}
                    >
                        {confirmLabel}
                    </button>
                </div>

            </div>
        </div>
    );
}
