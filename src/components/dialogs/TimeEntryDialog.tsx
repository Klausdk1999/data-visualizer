"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchableSelect } from "@/components/ui/combobox";
import type { TimeEntry, CreateTimeEntryRequest, ProductionOrder, Service, User } from "@/types";
import { useFormNavigation } from "@/lib/useFormNavigation";

// A single interval row (without user_id / day, which are shared)
interface IntervalEntry {
  id: string;
  production_order_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  observations: string;
}

const emptyInterval = (): IntervalEntry => ({
  id: crypto.randomUUID(),
  production_order_id: "",
  service_id: "",
  start_time: "",
  end_time: "",
  observations: "",
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
  open, onOpenChange, editingItem, onSubmit,
  productionOrders, services, users, currentUser,
}: TimeEntryDialogProps) {
  const t = useTranslations("hours");
  const tc = useTranslations("common");

  const isWorker = currentUser?.type === "worker";
  const handleKeyDown = useFormNavigation();
  const [userId, setUserId] = useState<string>("");
  const [day, setDay] = useState<string>("");
  const [intervals, setIntervals] = useState<IntervalEntry[]>([emptyInterval()]);

  // Build option lists
  const userOptions = users.map((u) => ({ value: String(u.id), label: u.name }));
  const orderOptions = productionOrders.map((o) => ({
    value: String(o.id),
    label: `OP #${o.id} – ${o.product?.name ?? `Product #${o.product_id}`}`,
  }));
  const serviceOptions = services
    .filter((s) => s.is_active)
    .map((s) => ({ value: String(s.id), label: `${s.code} – ${s.name}` }));

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setUserId(String(editingItem.user_id));
        setDay(editingItem.day ?? "");
        setIntervals([{
          id: crypto.randomUUID(),
          production_order_id: String(editingItem.production_order_id),
          service_id: String(editingItem.service_id),
          start_time: editingItem.start_time ?? "",
          end_time: editingItem.end_time ?? "",
          observations: editingItem.observations ?? "",
        }]);
      } else {
        setUserId(isWorker && currentUser ? String(currentUser.id) : "");
        setDay("");
        setIntervals([emptyInterval()]);
      }
    }
  }, [open, editingItem, isWorker, currentUser]);

  const updateInterval = useCallback(
    (id: string, field: keyof Omit<IntervalEntry, "id">, value: string) => {
      setIntervals((prev) =>
        prev.map((interval) =>
          interval.id === id ? { ...interval, [field]: value } : interval
        )
      );
    },
    []
  );

  //const addInterval = () => setIntervals((prev) => [...prev, emptyInterval()]);
  const addInterval = () => {
    const newInterval = emptyInterval();

    setIntervals((prev) => [...prev, newInterval]);

    // Aguarda o React renderizar o novo intervalo antes de mover o foco.
    setTimeout(() => {
      // Foca o último combobox renderizado, que corresponde ao intervalo recém-adicionado.
      const comboboxes = document.querySelectorAll('[role="combobox"]');
      const lastCombobox = comboboxes[comboboxes.length - 1] as HTMLElement | undefined;

      if (lastCombobox) {
        lastCombobox.focus();

        // Opcional (HACK de UI): Se quiser que a lista já caia aberta, descomente a linha abaixo.
        // lastCombobox.click();
      }
    }, 100);
  };
  const removeInterval = (id: string) =>
    setIntervals((prev) => prev.filter((i) => i.id !== id));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const resolvedUserId = isWorker && currentUser
      ? currentUser.id
      : Number(userId);

    const entries: CreateTimeEntryRequest[] = intervals.map((interval) => ({
      user_id: resolvedUserId,
      production_order_id: Number(interval.production_order_id),
      service_id: Number(interval.service_id),
      day,
      start_time: interval.start_time,
      end_time: interval.end_time,
      observations: interval.observations || undefined,
    }));

    onSubmit(entries);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editingItem ? t("editEntry") : t("createEntry")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}onKeyDown={handleKeyDown}>
          <div className="space-y-4 py-4">
            {/* Shared: Worker selector */}
            {!isWorker && (
              <div>
                <Label className="text-gray-700 dark:text-gray-300">
                  {t("worker")} *
                </Label>
                <SearchableSelect
                  options={userOptions}
                  value={userId}
                  onChange={setUserId}
                  placeholder={t("selectWorker")}
                  searchPlaceholder={tc("search")}
                  notFoundText={tc("noResults")}
                  required
                />
              </div>
            )}

            {/* Shared: Day */}
            <div>
              <Label htmlFor="entry-day" className="text-gray-700 dark:text-gray-300">
                {t("day")} *
              </Label>
              <Input
                id="entry-day"
                type="date"
                required
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Interval list */}
            <div className="space-y-3">
              {intervals.map((interval, index) => (
                <div
                  key={interval.id}
                  className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {t("interval")} {index + 1}
                    </span>
                    {intervals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInterval(interval.id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        {t("removeInterval")}
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Order */}
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">
                        {t("order")} *
                      </Label>
                      <SearchableSelect
                        options={orderOptions}
                        value={interval.production_order_id}
                        onChange={(v) => updateInterval(interval.id, "production_order_id", v)}
                        placeholder={t("selectOrder")}
                        searchPlaceholder={tc("search")}
                        notFoundText={tc("noResults")}
                        required
                      />
                    </div>

                    {/* Service */}
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">
                        {t("service")} *
                      </Label>
                      <SearchableSelect
                        options={serviceOptions}
                        value={interval.service_id}
                        onChange={(v) => updateInterval(interval.id, "service_id", v)}
                        placeholder={t("selectService")}
                        searchPlaceholder={tc("search")}
                        notFoundText={tc("noResults")}
                        required
                      />
                    </div>

                    {/* Start / End times */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">
                          {t("startTime")} *
                        </Label>
                        <Input
                          type="time"
                          required
                          value={interval.start_time}
                          onChange={(e) =>
                            updateInterval(interval.id, "start_time", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">
                          {t("endTime")} *
                        </Label>
                        <Input
                          type="time"
                          required
                          value={interval.end_time}
                          onChange={(e) =>
                            updateInterval(interval.id, "end_time", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Observations */}
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">
                        {t("observations")}
                      </Label>
                      <textarea
                        rows={2}
                        value={interval.observations}
                        onChange={(e) =>
                          updateInterval(interval.id, "observations", e.target.value)
                        }
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add interval button (only when creating) */}
            {!editingItem && (
              <button
                type="button"
                onClick={addInterval}
                className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t("addInterval")}
              </button>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {tc("cancel")}
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
