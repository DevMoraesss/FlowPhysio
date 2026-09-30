"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Download, Loader2, AlertTriangle, FileText } from "lucide-react";

interface AttachmentPreviewProps {
    attachmentId: string;
    fileName: string;
    contentType: string;
    onClose: () => void;
}

/**
 * Visualizador de anexo em tela cheia.
 *
 * Por que não usar <img src="/api/attachments/.../download"> direto: o endpoint
 * exige o token JWT no cabeçalho, e as tags <img> e <iframe> não mandam
 * cabeçalho nenhum. Criar uma rota pública para o navegador conseguir abrir
 * resolveria o problema e abriria outro bem pior, porque exame de paciente
 * ficaria acessível a quem descobrisse a URL.
 *
 * O caminho usado aqui é o mesmo do download: busca os bytes com o token,
 * transforma em Blob e gera uma URL local de memória (blob:) que só existe
 * dentro desta aba. O arquivo aparece na tela sem nunca ter sido exposto.
 */
export function AttachmentPreview({ attachmentId, fileName, contentType, onClose }: AttachmentPreviewProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [error, setError] = useState("");

    const isImage = contentType.startsWith("image/");
    const isPdf = contentType === "application/pdf";
    const canPreview = isImage || isPdf;

    // Busca o arquivo e cria a URL de memória.
    useEffect(() => {
        if (!canPreview) return;

        // Guarda a URL numa variável local, e não só no estado, porque a função
        // de limpeza precisa dela para liberar a memória. Sem revokeObjectURL o
        // arquivo fica preso na aba até recarregar a página.
        let createdUrl: string | null = null;
        let cancelled = false;

        const load = async () => {
            try {
                const token = localStorage.getItem("physioflow_token");
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

                const response = await fetch(`${API_URL}/attachments/${attachmentId}/download`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (!response.ok) throw new Error("Não foi possível abrir este arquivo.");

                const blob = await response.blob();

                // Se a janela fechou enquanto o arquivo baixava, não cria a URL:
                // ela nunca seria liberada.
                if (cancelled) return;

                createdUrl = URL.createObjectURL(blob);
                setObjectUrl(createdUrl);
            } catch (err: any) {
                if (!cancelled) setError(err.message || "Erro ao abrir o arquivo.");
            }
        };

        load();

        return () => {
            cancelled = true;
            if (createdUrl) URL.revokeObjectURL(createdUrl);
        };
    }, [attachmentId, canPreview]);

    // Esc fecha, e o fundo da página para de rolar enquanto a janela está aberta.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        const scrollAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = scrollAnterior;
        };
    }, [onClose]);

    const handleDownload = useCallback(() => {
        if (!objectUrl) return;

        // Reaproveita o arquivo que já está na memória: não baixa de novo.
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName;
        link.click();
    }, [objectUrl, fileName]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-preview-anexo"
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-sage-900/70 p-4 backdrop-blur-sm dark:bg-black/80"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-sage-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            >
                {/* Cabeçalho */}
                <div className="flex items-center gap-3 border-b border-sage-100 px-6 py-4 dark:border-zinc-900">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                        <FileText size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p id="titulo-preview-anexo" className="truncate text-sm font-semibold text-sage-700 dark:text-white">
                            {fileName}
                        </p>
                        <p className="text-xs text-sage-400">{contentType}</p>
                    </div>

                    {/* Rótulo escrito, e não só ícone: a ação precisa ser óbvia
                        para quem não convive com esse tipo de interface. */}
                    <button
                        onClick={handleDownload}
                        disabled={!objectUrl}
                        className="flex shrink-0 items-center gap-2 rounded-xl border border-sage-200 px-4 py-2.5 text-sm font-semibold text-sage-600 transition-all hover:border-brand-primary/30 hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Baixar</span>
                    </button>

                    <button
                        onClick={onClose}
                        aria-label="Fechar visualização"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sage-200 text-sage-500 transition-all hover:border-red-200 hover:text-red-500 dark:border-zinc-700 dark:text-zinc-400"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="flex flex-1 items-center justify-center overflow-auto bg-sage-50 p-4 dark:bg-zinc-900/40">
                    {!canPreview ? (
                        <div className="px-6 text-center text-sage-500">
                            <FileText size={40} className="mx-auto mb-3 text-sage-300 dark:text-zinc-700" />
                            <p className="font-medium text-sage-600 dark:text-zinc-300">
                                Este tipo de arquivo não abre aqui.
                            </p>
                            <p className="mt-1 text-sm">Use o botão Baixar para abrir no computador.</p>
                        </div>
                    ) : error ? (
                        <div className="px-6 text-center">
                            <AlertTriangle size={40} className="mx-auto mb-3 text-red-400" />
                            <p className="font-medium text-sage-700 dark:text-zinc-200">{error}</p>
                        </div>
                    ) : !objectUrl ? (
                        <div className="text-center text-sage-500">
                            <Loader2 size={32} className="mx-auto mb-3 animate-spin text-brand-primary" />
                            <p className="text-sm">Abrindo arquivo</p>
                        </div>
                    ) : isImage ? (
                        // O <img> aqui é proposital. O next/image otimiza arquivos
                        // servidos pelo servidor, e esta imagem é uma URL blob: que
                        // só existe na memória do navegador. Não há o que otimizar.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={objectUrl}
                            alt={fileName}
                            className="max-h-full max-w-full rounded-xl object-contain"
                        />
                    ) : (
                        <iframe
                            src={objectUrl}
                            title={fileName}
                            className="h-full w-full rounded-xl border border-sage-200 bg-white dark:border-zinc-800"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
