"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AlertTriangle, Loader2 } from "lucide-react";

interface AnamnesisAlertProps {
    patientId: string;
    compact?: boolean; // Se true, mostra uma versão menor pro Card da listagem
}

export function AnamnesisAlert({ patientId, compact = false }: AnamnesisAlertProps) {
    const [isOutdated, setIsOutdated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAnamnesis() {
            try {
                // Chama a rota de avaliações do paciente
                const assessments = await apiFetch(`/assessments/patient/${patientId}`);
                
                // Se não tem nenhuma avaliação, já acusa que precisa fazer
                if (!assessments || assessments.length === 0) {
                    setIsOutdated(true);
                    return;
                }

                // Ordena da mais recente para a mais antiga e pega a primeira
                const sortedAssessments = assessments.sort((a: any, b: any) => 
                    new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
                );
                
                const lastAssessmentDate = new Date(sortedAssessments[0].assessmentDate);

                // Calcula a data de vencimento (Soma 3 meses)
                const expirationDate = new Date(lastAssessmentDate);
                expirationDate.setMonth(expirationDate.getMonth() + 3);

                // Se a data de hoje for maior que a data de vencimento, tá desatualizada
                if (new Date() > expirationDate) {
                    setIsOutdated(true);
                }
            } catch (error) {
                console.error("Erro ao verificar anamnese:", error);
            } finally {
                setLoading(false);
            }
        }

        checkAnamnesis();
    }, [patientId]);

    if (loading) {
        return (
            <div className="mt-4 flex items-center gap-2 text-xs text-sage-400">
                <Loader2 size={12} className="animate-spin" /> Verificando anamnese...
            </div>
        );
    }

    if (!isOutdated) return null;

    // Renderiza a versão compacta (ideal para o Card do paciente)
    if (compact) {
        return (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-500">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Anamnese desatualizada ou ausente</span>
            </div>
        );
    }

    // Renderiza a versão completa (ideal para jogar dentro do Prontuário)
    return (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-500">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div className="text-sm">
                <p className="font-bold">Atenção!</p>
                <p>A última anamnese deste paciente foi feita há mais de 3 meses (ou ainda não foi registrada). É hora de realizar uma reavaliação.</p>
            </div>
        </div>
    );
}