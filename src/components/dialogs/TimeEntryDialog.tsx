"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Save,
  Plus,
  Trash2,
  Clock,
  Calendar,
  User as UserIcon,
  CalendarPlus,
  Sparkles,
  Info,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchableSelect } from "@/components/ui/combobox";
import { TimeMaskInput } from "@/components/ui/time-mask-input";
import type { TimeEntry, CreateTimeEntryRequest, ProductionOrder, Service, User } from "@/types";

// Um intervalo individual
interface IntervalRow {
  id: string;
  production_order_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  observations: string;
}

// Um bloco de dia (que contém múltiplos intervalos)
interface DayGroup {
  id: string;
  day: string;
  intervals: IntervalRow[];
}

const emptyInterval = (suggestedStartTime: string = ""): IntervalRow => ({
  id: crypto.randomUUID(),
  production_order_id: "",
  service_id: "",
  start_time: suggestedStartTime,
  end_time: "",
  observations: "",
});

const emptyDayGroup = (initialDate: string = "", suggestedStartTime: string = ""): DayGroup => ({
  id: crypto.randomUUID(),
  day: initialDate,
  intervals: [emptyInterval(suggestedStartTime)],
});

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: TimeEntry | null;
  onSubmit: (data: CreateTimeEntryRequest[]) => void;
  productionOrders: ProductionOrder[];
  services: Service[];
  users: User[];
  currentUser: User | null;
}

export default function TimeEntryDialog({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
  productionOrders,
  services,
  users,
  currentUser,
}: TimeEntryDialogProps) {
  const t = useTranslations("hours");
  const tc = useTranslations("common");

  const isWorker = currentUser?.type === "worker";
  const [userId, setUserId] = useState<string>("");
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([emptyDayGroup()]);

  const formRef = useRef<HTMLFormElement>(null);
  const pendingEnterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lista de opções
  const userOptions = users.map((u) => ({ value: String(u.id), label: u.name }));
  const orderOptions = productionOrders.map((o) => ({
    value: String(o.id),
    label: `OP #${o.id} – ${o.product?.name ?? `Prod #${o.product_id}`}`,
  }));
  const serviceOptions = services
    .filter((s) => s.is_active)
    .map((s) => ({ value: String(s.id), label: `${s.code} – ${s.name}` }));

  // Helper de data
  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setUserId(String(editingItem.user_id));
        setDayGroups([
          {
            id: crypto.randomUUID(),
            day: editingItem.day ?? "",
            intervals: [
              {
                id: crypto.randomUUID(),
                production_order_id: String(editingItem.production_order_id),
                service_id: String(editingItem.service_id),
                start_time: editingItem.start_time ?? "",
                end_time: editingItem.end_time ?? "",
                observations: editingItem.observations ?? "",
              },
            ],
          },
        ]);
      } else {
        setUserId(isWorker && currentUser ? String(currentUser.id) : "");
        setDayGroups([emptyDayGroup(getTodayDate())]);
      }
    }
  }, [open, editingItem, isWorker, currentUser]);

  // Atualiza data de um DayGroup
  const updateDay = (groupId: string, newDay: string) => {
    setDayGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, day: newDay } : g))
    );
  };

  // Atualiza campo de um intervalo
  const updateInterval = useCallback(
    (groupId: string, intervalId: string, field: keyof Omit<IntervalRow, "id">, value: string) => {
      setDayGroups((prev) =>
        prev.map((group) => {
          if (group.id !== groupId) return group;
          return {
            ...group,
            intervals: group.intervals.map((item) =>
              item.id === intervalId ? { ...item, [field]: value } : item
            ),
          };
        })
      );
    },
    []
  );

  // Adiciona nova linha de intervalo no mesmo dia
  const addIntervalToGroup = useCallback((groupId: string) => {
    setDayGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        const last = group.intervals[group.intervals.length - 1];
        const suggestedStart = last ? last.end_time : "";
        return {
          ...group,
          intervals: [...group.intervals, emptyInterval(suggestedStart)],
        };
      })
    );

    // Foca o combobox de OP da nova linha adicionada
    setTimeout(() => {
      const groupEl = document.querySelector(`[data-group-id="${groupId}"]`);
      if (groupEl) {
        const comboboxes = groupEl.querySelectorAll('[role="combobox"]');
        const lastRowOrder = comboboxes[comboboxes.length - 2] as HTMLElement | undefined;
        if (lastRowOrder) lastRowOrder.focus();
      }
    }, 80);
  }, []);

  // Remove intervalo
  const removeInterval = (groupId: string, intervalId: string) => {
    setDayGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          intervals: group.intervals.filter((i) => i.id !== intervalId),
        };
      })
    );
  };

  // Adiciona um novo dia (novo grupo)
  const addNewDayGroup = useCallback(() => {
    setDayGroups((prev) => {
      let nextDate = getTodayDate();
      if (prev.length > 0) {
        const lastDay = prev[prev.length - 1].day;
        if (lastDay) {
          // Incrementa 1 dia automaticamente para facilitar digitação sequencial
          const d = new Date(lastDay + "T00:00:00");
          d.setDate(d.getDate() + 1);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          nextDate = `${y}-${m}-${day}`;
        }
      }
      return [...prev, emptyDayGroup(nextDate)];
    });

    // Foca o campo de data do novo grupo
    setTimeout(() => {
      const dayInputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
      const lastDayInput = dayInputs[dayInputs.length - 1];
      if (lastDayInput) {
        lastDayInput.focus();
      }
    }, 80);
  }, []);

  // Remove grupo inteiro de dia
  const removeDayGroup = (groupId: string) => {
    if (dayGroups.length <= 1) return;
    setDayGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  // Navegação contínua pelo teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;

      // 1. Se for combobox aberto, deixa o combobox processar internamente
      const isCombobox = target.getAttribute("role") === "combobox";
      const isExpanded = target.getAttribute("aria-expanded") === "true";
      if (isCombobox && isExpanded) return;

      // 2. Se for botão de submit (Salvar), deixa enviar
      if (target.getAttribute("type") === "submit") {
        return;
      }

      // 3. Se for botão de ação rápida
      if (target.tagName === "BUTTON") {
        if (target.getAttribute("data-action") === "add-interval") {
          e.preventDefault();
          const groupId = target.getAttribute("data-group-target");
          if (groupId) addIntervalToGroup(groupId);
          return;
        }
        if (target.getAttribute("data-action") === "add-day") {
          e.preventDefault();
          addNewDayGroup();
          return;
        }
      }

      // 4. Se for campo de observações (fim da linha)
      if (target.tagName === "TEXTAREA" && !editingItem) {
        if (!e.shiftKey) {
          e.preventDefault();
          const groupId = target.getAttribute("data-group-id");

          if (pendingEnterTimeoutRef.current) {
            // SEGUNDO ENTER DETECTADO DENTRO DA JANELA -> CRIA NOVO DIA
            clearTimeout(pendingEnterTimeoutRef.current);
            pendingEnterTimeoutRef.current = null;
            addNewDayGroup();
            return;
          }

          // PRIMEIRO ENTER: agenda criação de nova linha caso não venha um segundo enter em 300ms
          pendingEnterTimeoutRef.current = setTimeout(() => {
            pendingEnterTimeoutRef.current = null;
            if (groupId) {
              addIntervalToGroup(groupId);
            }
          }, 300);
          return;
        } else {
          return; // Shift+Enter quebra linha na observação
        }
      }

      // 5. Previne submissão e avança para o próximo elemento focalizável
      e.preventDefault();

      const form = formRef.current;
      if (!form) return;

      const focusable = Array.from(
        form.querySelectorAll<HTMLElement>(
          'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), textarea:not([disabled]), button:not([disabled]):not([data-skip-nav]), [role="combobox"]:not([disabled])'
        )
      ).filter((el) => el.tabIndex >= 0 && el.offsetWidth > 0 && el.offsetHeight > 0);

      const currentIndex = focusable.indexOf(target);
      if (currentIndex > -1) {
        const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
        if (nextIndex >= 0 && nextIndex < focusable.length) {
          focusable[nextIndex].focus();
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const resolvedUserId = isWorker && currentUser ? currentUser.id : Number(userId);

    // Coleta todas as entradas de todos os dias
    const allEntries: CreateTimeEntryRequest[] = [];

    dayGroups.forEach((group) => {
      group.intervals.forEach((interval) => {
        // Ignora linha vazia sem OP selecionada caso tenha mais de uma
        if (!interval.production_order_id && !interval.service_id && !interval.start_time) {
          return;
        }
        allEntries.push({
          user_id: resolvedUserId,
          production_order_id: Number(interval.production_order_id),
          service_id: Number(interval.service_id),
          day: group.day,
          start_time: interval.start_time,
          end_time: interval.end_time,
          observations: interval.observations || undefined,
        });
      });
    });

    if (allEntries.length === 0) {
      alert(t("emptyWarning") || "Preencha ao menos um intervalo com ordem, serviço e horários.");
      return;
    }

    onSubmit(allEntries);
  };

  // Contagem de totais
  const totalIntervalsCount = dayGroups.reduce((acc, g) => acc + g.intervals.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2.5 text-base font-bold">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Clock className="w-5 h-5" />
              </div>
              {editingItem ? t("editEntry") : t("createEntry")}
            </DialogTitle>
            {!editingItem && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                {dayGroups.length} {dayGroups.length === 1 ? "dia" : "dias"} • {totalIntervalsCount} {totalIntervalsCount === 1 ? "intervalo" : "intervalos"}
              </span>
            )}
          </div>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className="space-y-6 py-4">
            {/* Bloco 1: Seleção de Funcionário */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40">
              {!isWorker ? (
                <div className="max-w-md">
                  <Label htmlFor="entry-worker" className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
                    <UserIcon className="w-4 h-4 text-indigo-500" />
                    {t("worker")} *
                  </Label>
                  <SearchableSelect
                    id="entry-worker"
                    options={userOptions}
                    value={userId}
                    onChange={setUserId}
                    placeholder={t("selectWorker")}
                    searchPlaceholder={tc("search")}
                    notFoundText={tc("noResults")}
                    required
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                    {(currentUser?.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {t("worker")}
                    </span>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {currentUser?.name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dica de atalhos */}
            {!editingItem && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs">
                <Sparkles className="w-4 h-4 shrink-0 text-blue-500" />
                <span className="flex-1">
                  <strong>Dica de agilidade:</strong> Pressione <strong>Enter</strong> na observação para adicionar uma nova linha. Pressione <strong>dois Enters</strong> seguidos para abrir um <strong>novo dia</strong>. Digite números direto nas horas (ex: <code>0800</code>).
                </span>
              </div>
            )}

            {/* Bloco 2: Lista de Dias e seus respectivos intervalos */}
            <div className="space-y-6">
              {dayGroups.map((group, groupIndex) => (
                <div
                  key={group.id}
                  data-group-id={group.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm"
                >
                  {/* Cabeçalho do Dia */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gray-50/90 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-indigo-500 text-white">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`day-input-${group.id}`} className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          {t("day")} *
                        </Label>
                        <Input
                          id={`day-input-${group.id}`}
                          type="date"
                          required
                          value={group.day}
                          onChange={(e) => updateDay(group.id, e.target.value)}
                          className="h-9 w-44 font-medium text-xs bg-white dark:bg-gray-900 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Dia #{groupIndex + 1} ({group.intervals.length} {group.intervals.length === 1 ? "linha" : "linhas"})
                      </span>
                      {dayGroups.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDayGroup(group.id)}
                          data-skip-nav="true"
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Remover este dia inteiro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabela Padronizada de Intervalos */}
                  <div className="p-4 space-y-3">
                    {/* Cabeçalho das Colunas Padronizadas */}
                    <div className="hidden md:grid grid-cols-12 gap-3 px-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <div className="col-span-4">{t("order")} *</div>
                      <div className="col-span-3">{t("service")} *</div>
                      <div className="col-span-2 text-center">{t("startTime")} *</div>
                      <div className="col-span-2 text-center">{t("endTime")} *</div>
                      <div className="col-span-1 text-center">Ações</div>
                    </div>

                    {/* Linhas de Intervalo */}
                    {group.intervals.map((interval, intIndex) => {
                      const isLastIntervalInGroup = intIndex === group.intervals.length - 1;

                      return (
                        <div
                          key={interval.id}
                          className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all space-y-2.5"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            {/* OP (4 colunas) */}
                            <div className="md:col-span-4">
                              <span className="md:hidden text-[11px] font-bold text-gray-500 mb-1 block">
                                {t("order")} *
                              </span>
                              <SearchableSelect
                                options={orderOptions}
                                value={interval.production_order_id}
                                onChange={(v) => updateInterval(group.id, interval.id, "production_order_id", v)}
                                placeholder={t("selectOrder")}
                                searchPlaceholder={tc("search")}
                                notFoundText={tc("noResults")}
                                required
                              />
                            </div>

                            {/* Serviço (3 colunas) */}
                            <div className="md:col-span-3">
                              <span className="md:hidden text-[11px] font-bold text-gray-500 mb-1 block">
                                {t("service")} *
                              </span>
                              <SearchableSelect
                                options={serviceOptions}
                                value={interval.service_id}
                                onChange={(v) => updateInterval(group.id, interval.id, "service_id", v)}
                                placeholder={t("selectService")}
                                searchPlaceholder={tc("search")}
                                notFoundText={tc("noResults")}
                                required
                              />
                            </div>

                            {/* Hora Início (2 colunas) */}
                            <div className="md:col-span-2">
                              <span className="md:hidden text-[11px] font-bold text-gray-500 mb-1 block">
                                {t("startTime")} *
                              </span>
                              <TimeMaskInput
                                value={interval.start_time}
                                onChange={(val) => updateInterval(group.id, interval.id, "start_time", val)}
                                required
                                placeholder="08:00"
                                className="h-9 text-xs"
                              />
                            </div>

                            {/* Hora Fim (2 colunas) */}
                            <div className="md:col-span-2">
                              <span className="md:hidden text-[11px] font-bold text-gray-500 mb-1 block">
                                {t("endTime")} *
                              </span>
                              <TimeMaskInput
                                value={interval.end_time}
                                onChange={(val) => updateInterval(group.id, interval.id, "end_time", val)}
                                required
                                placeholder="12:00"
                                className="h-9 text-xs"
                              />
                            </div>

                            {/* Ações (1 coluna) */}
                            <div className="md:col-span-1 flex justify-center">
                              {group.intervals.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeInterval(group.id, interval.id)}
                                  data-skip-nav="true"
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                                  title={t("removeInterval")}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Campo de Observações na largura total */}
                          <div>
                            <textarea
                              rows={1}
                              data-group-id={group.id}
                              data-is-last-interval={isLastIntervalInGroup ? "true" : "false"}
                              placeholder={t("observationsPlaceholder") || "Observações (opcional). [Enter] = Próxima linha | [Enter duplo] = Novo dia..."}
                              value={interval.observations}
                              onChange={(e) => updateInterval(group.id, interval.id, "observations", e.target.value)}
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Botão de Adicionar Linha no Dia */}
                    {!editingItem && (
                      <button
                        type="button"
                        data-action="add-interval"
                        data-group-target={group.id}
                        onClick={() => addIntervalToGroup(group.id)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t("addInterval")} neste dia
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botão de Adicionar NOVO DIA (Para lotes/semanas completas) */}
            {!editingItem && (
              <button
                type="button"
                data-action="add-day"
                onClick={addNewDayGroup}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 py-3.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all shadow-sm"
              >
                <CalendarPlus className="w-4 h-4" />
                Adicionar Novo Dia para este Funcionário (Enter Duplo nas Observações)
              </button>
            )}
          </div>

          <DialogFooter className="mt-5 border-t border-gray-100 dark:border-gray-800 pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {tc("cancel")}
            </Button>
            <Button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
              <Save className="w-4 h-4" />
              {tc("save")} ({totalIntervalsCount} {totalIntervalsCount === 1 ? "registro" : "registros"})
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
