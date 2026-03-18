"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getTimeEntries } from "@/lib/requestHandlers";
import { useTranslations, useLocale } from "next-intl";
import { Clock, Calendar, User, Wrench, AlertTriangle } from "lucide-react";
import type { ProductionOrder, TimeEntry } from "@/types";

interface OrderSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ProductionOrder | null;
}

// Calcula horas entre dois horários "HH:MM"
function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

function fmt(iso?: string | null, locale?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale ?? "pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function OrderSummaryDialog({ open, onOpenChange, order }: OrderSummaryDialogProps) {
  const locale = useLocale();
  const isPT = locale === "pt-BR";
  const t = useTranslations("orders");

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Busca os lançamentos de horas sempre que abrir com uma ordem
  useEffect(() => {
    if (!open || !order) return;

    setLoading(true);
    setError(false);
    setEntries([]);

    getTimeEntries({ production_order_id: order.id.toString() })
      .then(setEntries)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [open, order]);

  if (!order) return null;

  // ── Cálculos do resumo ──
  const totalHours = entries.reduce((acc, e) => acc + calcHours(e.start_time, e.end_time), 0);

  const statusMap: Record<string, string> = {
    planned: isPT ? "Planejada" : "Planned",
    in_progress: isPT ? "Em Andamento" : "In Progress",
    completed: isPT ? "Concluída" : "Completed",
    cancelled: isPT ? "Cancelada" : "Cancelled",
  };

  const statusColor: Record<string, string> = {
    planned: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };

  // Agrupa horas por colaborador para o resumo
  const byCollaborator: Record<string, number> = {};
  entries.forEach((e) => {
    const name = e.user?.name ?? `ID ${e.user_id}`;
    byCollaborator[name] = (byCollaborator[name] ?? 0) + calcHours(e.start_time, e.end_time);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            {isPT ? `Resumo da Ordem #${order.id}` : `Order Summary #${order.id}`}
            <span
              className={`ml-2 text-xs font-semibold px-2 py-1 rounded-full ${statusColor[order.status] ?? ""}`}
            >
              {statusMap[order.status] ?? order.status}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── Identificação ── */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
              {isPT ? "Identificação" : "Identification"}
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                [isPT ? "Produto" : "Product", order.product?.name ?? order.product_id],
                [isPT ? "Cliente" : "Customer", order.customer?.name ?? "—"],
                [isPT ? "Quantidade" : "Quantity", order.quantity],
                [isPT ? "Prioridade" : "Priority", order.priority ?? "—"],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                    {String(value)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Datas ── */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {isPT ? "Datas" : "Dates"}
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                [isPT ? "Criação" : "Created", fmt(order.created_at, locale)],
                [
                  isPT ? "Previsão de Entrega" : "Planned Delivery",
                  fmt(order.planned_delivery_date, locale),
                ],
                [isPT ? "Início" : "Started", fmt(order.started_at, locale)],
                [isPT ? "Conclusão" : "Completed", fmt(order.completed_at, locale)],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                    {String(value)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Resumo de horas ── */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {isPT ? "Horas Trabalhadas" : "Hours Worked"}
            </h3>

            {loading && (
              <p className="text-sm text-gray-400 text-center py-4">
                {isPT ? "Carregando..." : "Loading..."}
              </p>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 py-2">
                <AlertTriangle className="w-4 h-4" />
                {isPT ? "Erro ao carregar lançamentos." : "Failed to load entries."}
              </div>
            )}

            {!loading && !error && entries.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                {isPT ? "Nenhum lançamento de horas encontrado." : "No time entries found."}
              </p>
            )}

            {!loading && !error && entries.length > 0 && (
              <>
                {/* Card total */}
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mb-4">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    {isPT ? "Total de horas na ordem" : "Total hours on order"}
                  </span>
                  <span className="text-2xl font-black text-blue-700 dark:text-blue-400">
                    {totalHours.toFixed(1)}h
                  </span>
                </div>

                {/* Resumo por colaborador */}
                {Object.keys(byCollaborator).length > 1 && (
                  <div className="mb-4 space-y-1.5">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                      {isPT ? "Por colaborador" : "By collaborator"}
                    </p>
                    {Object.entries(byCollaborator)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, hours]) => (
                        <div key={name} className="flex items-center gap-3">
                          <div className="w-32 shrink-0">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                              {name}
                            </p>
                          </div>
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(hours / totalHours) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-12 text-right">
                            {hours.toFixed(1)}h
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Lista detalhada de lançamentos */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                    {isPT ? "Lançamentos detalhados" : "Detailed entries"}
                  </p>
                  {entries
                    .sort((a, b) => a.day.localeCompare(b.day))
                    .map((entry) => {
                      const hours = calcHours(entry.start_time, entry.end_time);
                      return (
                        <div
                          key={entry.id}
                          className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Colaborador e serviço */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  <User className="w-3.5 h-3.5 text-gray-400" />
                                  {entry.user?.name ?? `ID ${entry.user_id}`}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <Wrench className="w-3 h-3" />
                                  {entry.service?.name ?? `Serviço ID ${entry.service_id}`}
                                </span>
                              </div>

                              {/* Data e horário */}
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {fmt(entry.day, locale)}
                                <span>·</span>
                                <Clock className="w-3 h-3" />
                                {entry.start_time} → {entry.end_time}
                              </div>

                              {/* Observações */}
                              {entry.observations && (
                                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1">
                                  {entry.observations}
                                </p>
                              )}
                            </div>

                            {/* Total de horas do lançamento */}
                            <div className="shrink-0 text-right">
                              <p className="text-xs text-gray-400">{isPT ? "Horas" : "Hours"}</p>
                              <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                                {hours.toFixed(1)}h
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </section>

          {/* ── Instruções e Notas (se preenchidas) ── */}
          {(order.work_instructions || order.quality_notes) && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
                {isPT ? "Notas" : "Notes"}
              </h3>
              {order.work_instructions && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {isPT ? "Instruções de Trabalho" : "Work Instructions"}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    {order.work_instructions}
                  </p>
                </div>
              )}
              {order.quality_notes && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {isPT ? "Notas de Qualidade" : "Quality Notes"}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    {order.quality_notes}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
