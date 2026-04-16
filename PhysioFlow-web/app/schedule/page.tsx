"use client";

import { Sidebar } from "@/components/Sidebar";
import { Plus, X, Calendar as CalendarIcon, Clock, User, DollarSign, CheckCircle, Loader2 } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";

// ADICIONAR junto com os outros estados:
type DialogState = {
    title: string; message: string; confirmLabel?: string;
    variant?: "danger" | "warning" | "default";
    onConfirm: () => void; onCancel?: () => void;
} | null;


export default function SchedulePage() {
    const router = useRouter();
    const calendarRef = useRef<FullCalendar>(null);
    
    // Estado para controlar o modal de detalhes do agendamento
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [updating, setUpdating] = useState(false);
    const [showCompleteForm, setShowCompleteForm] = useState(false);
    const [closePaymentMethod, setClosePaymentMethod] = useState("1");
    const [dialog, setDialog] = useState<DialogState>(null);



    const handleDateClick = (arg: any) => {
        const dateStr = arg.dateStr?.split("T")[0] ?? "";
        router.push(`/schedule/new?date=${dateStr}`);
    };

    const handleEventClick = (clickInfo: any) => {
        setSelectedEvent({ id: clickInfo.event.id, ...clickInfo.event.extendedProps });
    };

    const closeModal = () => {
    setSelectedEvent(null);
    setShowCompleteForm(false);
    setClosePaymentMethod("1");
};

const handleUpdateStatus = async (status: number) => {
    setUpdating(true);
    try {
        const body: any = { status };
        if (status === 2) {
            const isPerSession = !selectedEvent.patientPaymentCycle || selectedEvent.patientPaymentCycle === 1;
            if (isPerSession) {
                body.paymentStatus = closePaymentMethod === "0" ? 1 : 2;
                if (closePaymentMethod !== "0") body.paymentMethod = Number(closePaymentMethod);
            } else {
                // Quinzenal/Mensal/Semanal: sessão concluída, pagamento pendente p/ cobrar depois
                body.paymentStatus = 1;
            }
        }

        await apiFetch(`/appointments/${selectedEvent.id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
        closeModal();
        calendarRef.current?.getApi().refetchEvents();
    } catch (err: any) {
        setDialog({
            title: "Erro ao atualizar sessão",
            message: err.message || "Não foi possível atualizar o status.",
            confirmLabel: "OK",
            onConfirm: () => setDialog(null),
        });

    } finally {
        setUpdating(false);
    }
};


    return (
        <div className="flex min-h-screen bg-sage-50 dark:bg-zinc-950">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-sage-700 dark:text-white font-serif">Minha Agenda</h1>
                        <p className="text-sage-500 dark:text-zinc-500 mt-1">Gerencie seus horários de atendimento.</p>
                    </div>
                    <Link
                        href="/schedule/new"
                        className="flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-3 font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-secondary hover:translate-y-[-2px]"
                    >
                        <Plus size={20} />
                        Novo Agendamento
                    </Link>
                </header>

                <div className="rounded-[2.5rem] border border-sage-200 bg-white p-6 wellness-shadow dark:border-zinc-900 dark:bg-zinc-900/40">
                    <div className="calendar-container">
<FullCalendar
    ref={calendarRef}
    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
    initialView="timeGridWeek"
    locales={[ptBrLocale]}
    locale="pt-br"
    headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
    }}
    events={async (fetchInfo, successCallback, failureCallback) => {
        try {
            const data = await apiFetch(
                `/appointments/range?start=${fetchInfo.startStr}&end=${fetchInfo.endStr}`
            );
            successCallback(data.map((appt: any) => ({
                id: appt.id,
                title: appt.patientName || "Paciente",
                start: appt.startDateTime,
                end: appt.endDateTime,
                backgroundColor: getStatusColor(appt.status).bg,
                borderColor: getStatusColor(appt.status).border,
                textColor: getStatusColor(appt.status).text,
                extendedProps: { ...appt }
            })));
        } catch (error) {
            failureCallback(error as Error);
        }
    }}
    dateClick={handleDateClick}
    eventClick={handleEventClick}
    allDaySlot={false}
    slotMinTime="06:00:00"
    slotMaxTime="22:00:00"
    height="auto"
    nowIndicator={true}
/>

                    </div>
                </div>
            </main>

            {/* Modal de Detalhes do Agendamento */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-sage-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-sage-800 dark:text-white font-serif">Detalhes da Sessão</h2>
                            <button onClick={closeModal} className="rounded-full p-2 text-sage-400 hover:bg-sage-100 dark:hover:bg-zinc-800 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-sage-400">Paciente</p>
                                    <p className="font-medium text-sage-700 dark:text-white">{selectedEvent.patientName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                    <CalendarIcon size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-sage-400">Data</p>
                                    <p className="font-medium text-sage-700 dark:text-white">
                                        {new Date(selectedEvent.startDateTime).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-sage-400">Horário</p>
                                    <p className="font-medium text-sage-700 dark:text-white">
                                        {new Date(selectedEvent.startDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedEvent.endDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary dark:bg-brand-primary/10">
                                    <DollarSign size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-sage-400">Valor</p>
                                    <p className="font-medium text-sage-700 dark:text-white">
                                        R$ {selectedEvent.sessionValue.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Ações por status */}
                        <div className="mt-8 space-y-3">
                            {selectedEvent.status === 1 && (
                                <>
                                    {/* PerSession (1) → exige forma de pagamento */}
                                    {(!selectedEvent.patientPaymentCycle || selectedEvent.patientPaymentCycle === 1) && (
                                        showCompleteForm ? (
                                            <div className="rounded-2xl bg-sage-50 dark:bg-zinc-800 p-4 space-y-3">
                                                <p className="text-sm font-bold text-sage-600 dark:text-zinc-300">Forma de pagamento:</p>
                                                <select
                                                    value={closePaymentMethod}
                                                    onChange={(e) => setClosePaymentMethod(e.target.value)}
                                                    className="w-full rounded-xl border border-sage-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-sage-700 dark:text-white outline-none focus:border-brand-primary"
                                                >
                                                    <option value="1">Pix</option>
                                                    <option value="2">Dinheiro</option>
                                                    <option value="3">Cartão</option>
                                                    <option value="0">Pagar depois</option>
                                                </select>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setShowCompleteForm(false)}
                                                        className="flex-1 rounded-2xl bg-white dark:bg-zinc-900 border border-sage-200 dark:border-zinc-700 py-2 text-sm font-bold text-sage-500 hover:bg-sage-50"
                                                    >
                                                        Voltar
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(2)}
                                                        disabled={updating}
                                                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-500 py-2 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-50"
                                                    >
                                                        {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                                        Confirmar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowCompleteForm(true)}
                                                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600 transition-all"
                                            >
                                                <CheckCircle size={16} />
                                                Concluir Sessão
                                            </button>
                                        )
                                    )}

                                    {/* Quinzenal / Mensal / Semanal → confirma direto, pagamento fica Pendente */}
                                    {selectedEvent.patientPaymentCycle && selectedEvent.patientPaymentCycle !== 1 && (
                                        <div className="space-y-3">
                                            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 text-center">
                                                Pagamento {selectedEvent.patientPaymentCycle === 2 ? "quinzenal" : selectedEvent.patientPaymentCycle === 3 ? "mensal" : "semanal"} — será cobrado depois
                                            </div>
                                            <button
                                                onClick={() => handleUpdateStatus(2)}
                                                disabled={updating}
                                                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-50 transition-all"
                                            >
                                                {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                                Concluir Sessão
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdateStatus(3)}
                                            disabled={updating}
                                            className="flex-1 rounded-2xl border border-amber-200 bg-amber-50 py-3 text-sm font-bold text-amber-600 hover:bg-amber-100 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-400 disabled:opacity-50 transition-all"
                                        >
                                            Falta
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(4)}
                                            disabled={updating}
                                            className="flex-1 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-500 hover:bg-red-100 dark:border-red-800/30 dark:bg-red-900/20 disabled:opacity-50 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </>
                            )}

                            {selectedEvent.status !== 1 && (
                                <div className="space-y-2">
                                    <div className={`rounded-xl px-4 py-2 text-center text-sm font-bold ${
                                        selectedEvent.status === 2
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : selectedEvent.status === 3
                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                    }`}>
                                        {selectedEvent.status === 2 ? "✓ Sessão Concluída"
                                            : selectedEvent.status === 3 ? "Paciente faltou"
                                            : "Sessão Cancelada"}
                                    </div>
                                    <button onClick={closeModal} className="w-full rounded-2xl bg-sage-50 py-3 text-sm font-bold text-sage-600 transition-all hover:bg-sage-100 dark:bg-zinc-800 dark:text-zinc-400">
                                        Fechar
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
            {dialog && (
                <Dialog
                    isOpen={true}
                    title={dialog.title}
                    message={dialog.message}
                    confirmLabel={dialog.confirmLabel}
                    variant={dialog.variant}
                    onConfirm={dialog.onConfirm}
                    onCancel={dialog.onCancel}
                />
            )}

            <style jsx global>{`
                .calendar-container {
                    --fc-border-color: #e4e9e5;
                    --fc-today-bg-color: rgba(20, 184, 166, 0.05);
                    --fc-neutral-bg-color: #fdfdfc;
                    --fc-neutral-text-color: #3d5a4a;
                    --fc-theme-standard-border-color: #e4e9e5;
                    font-family: inherit;
                }
                
                .dark .calendar-container {
                    --fc-border-color: #2c3530;
                    --fc-today-bg-color: rgba(20, 184, 166, 0.1);
                    --fc-neutral-bg-color: #1a201d;
                    --fc-neutral-text-color: #a1a1aa;
                    --fc-theme-standard-border-color: #2c3530;
                }

                .fc-toolbar-title {
                    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
                    color: #3d5a4a;
                    font-weight: 700;
                }
                .dark .fc-toolbar-title { color: white; }

                .fc-button-primary {
                    background-color: #fdfdfc !important;
                    border: 1px solid #e4e9e5 !important;
                    color: #3d5a4a !important;
                    border-radius: 1rem !important;
                    text-transform: capitalize;
                    font-weight: 600;
                    box-shadow: none !important;
                }
                .fc-button-primary:hover { background-color: #f0f4f1 !important; }
                .fc-button-active { background-color: #14b8a6 !important; color: white !important; border-color: #14b8a6 !important; }
                
                .dark .fc-button-primary { background-color: #1a201d !important; border-color: #2c3530 !important; color: #a1a1aa !important; }
                .dark .fc-button-primary:hover { background-color: #272f2b !important; }
                .dark .fc-button-active { background-color: #14b8a6 !important; color: white !important; }

                .fc-event { cursor: pointer; border-radius: 6px; padding: 2px 4px; border-width: 1px; }
            `}</style>
        </div>
    );
}

function getStatusColor(status: number) {
    switch (status) {
        case 1: return { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1" };
        case 2: return { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" };
        case 3: return { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" };
        case 4: return { bg: "#f4f4f5", border: "#e4e4e7", text: "#52525b" };
        default: return { bg: "#f3f4f6", border: "#d1d5db", text: "#374151" };
    }
}