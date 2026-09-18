"use client";

import { useState } from "react";
import { formatCpf, isValidCpf } from "@/lib/cpf";

interface CpfInputProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    placeholder?: string;
    className?: string;
}

/**
 * Campo de CPF com máscara automática e aviso de CPF inválido.
 *
 * Comportamento pensado para não atrapalhar quem está digitando:
 *   - a máscara é aplicada a cada tecla;
 *   - o erro só aparece quando a pessoa SAI do campo (onBlur), nunca no meio
 *     da digitação — senão ela veria "CPF inválido" já no primeiro dígito;
 *   - depois que apareceu, o erro some sozinho assim que o CPF fica válido.
 *
 * Não substitui a validação do backend: aqui é conforto, lá é garantia.
 */
export function CpfInput({
    name,
    value,
    onChange,
    required = false,
    placeholder = "000.000.000-00",
    className = "wellness-input",
}: CpfInputProps) {
    const [blurred, setBlurred] = useState(false);

    const isInvalid = blurred && value.trim() !== "" && !isValidCpf(value);

    // Reescreve o valor do input com a máscara antes de repassar ao formulário.
    // As telas leem e.target.name e e.target.value, então elas recebem o valor
    // já formatado sem precisar saber que existe máscara.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = formatCpf(e.target.value);
        onChange(e);
    };

    return (
        <>
            <input
                type="text"
                inputMode="numeric"
                name={name}
                value={value}
                onChange={handleChange}
                onBlur={() => setBlurred(true)}
                required={required}
                placeholder={placeholder}
                maxLength={14}
                className={className}
                style={isInvalid ? { borderColor: "#ef4444" } : undefined}
                aria-invalid={isInvalid}
                aria-describedby={isInvalid ? `${name}-erro` : undefined}
            />
            {isInvalid && (
                <p id={`${name}-erro`} className="ml-2 mt-1.5 text-xs font-medium text-red-500">
                    CPF inválido — confira os números
                </p>
            )}
        </>
    );
}
