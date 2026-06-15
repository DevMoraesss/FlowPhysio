"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
    required?: boolean;
    className?: string;
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Selecione...",
    disabled = false,
    icon,
    required,
    className = "",
}: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.value === value);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className={`relative ${className}`}>
            {/* Input oculto para validação nativa do form */}
            {required && (
                <input
                    type="text"
                    value={value}
                    required
                    readOnly
                    tabIndex={-1}
                    aria-hidden="true"
                    className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                />
            )}

            <button
                type="button"
                onClick={() => !disabled && setOpen(prev => !prev)}
                disabled={disabled}
                className={`w-full rounded-[1.25rem] border bg-[#fdfdfc] py-4 text-left text-sm transition-all dark:bg-[#1a201d] ${
                    icon ? "pl-12 pr-10" : "pl-4 pr-10"
                } ${
                    open
                        ? "border-brand-primary shadow-[0_0_0_4px_rgba(20,184,166,0.08)]"
                        : "border-[#e4e9e5] dark:border-[#2c3530] hover:border-sage-300 dark:hover:border-zinc-600"
                } ${
                    disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                }`}
            >
                <span className={selected ? "text-[#3d5a4a] dark:text-white" : "text-sage-300 dark:text-zinc-600"}>
                    {selected ? selected.label : placeholder}
                </span>
            </button>

            {icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400 pointer-events-none z-[1]">
                    {icon}
                </div>
            )}

            <ChevronDown
                size={16}
                className={`absolute right-4 top-1/2 -translate-y-1/2 text-sage-400 pointer-events-none transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />

            {open && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-sage-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                    {options.map(option => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setOpen(false);
                            }}
                            className={`w-full px-5 py-3 text-left text-sm transition-colors hover:bg-brand-soft hover:text-brand-primary dark:hover:bg-brand-primary/10 dark:hover:text-brand-primary ${
                                option.value === value
                                    ? "bg-brand-soft font-bold text-brand-primary dark:bg-brand-primary/10 dark:text-brand-primary"
                                    : "text-sage-700 dark:text-zinc-300"
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
