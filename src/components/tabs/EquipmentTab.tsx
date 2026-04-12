"use client";

import React, { useState } from "react";
import { ArrowLeft, Wifi, WifiOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetGrid } from "@/components/widgets";
import { usePreferences } from "@/hooks/usePreferences";
import { useLocale } from "next-intl";
import type { Device, Signal, User } from "@/types";
import type { GridLayout, WidgetConfig } from "@/types/widgets";

interface EquipmentTabProps {
  devices: Device[];
  signals: Signal[];
  user: User | null;
  userId: number;
  onEditDevice?: (device: Device) => void;
  onDeleteDevice?: (deviceId: number) => void;
}

// ── Device List ───────────────────────────────────────────────────────────────
function DeviceList({
  devices,
  onSelect,
  isPT,
}: {
  devices: Device[];
  onSelect: (d: Device) => void;
  isPT: boolean;
}) {
  const active = devices.filter((d) => d.is_active);
  const inactive = devices.filter((d) => !d.is_active);

  const Row = ({ device }: { device: Device }) => (
    <button
      onClick={() => onSelect(device)}
      className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left
        border transition-all duration-150
        bg-white border-gray-200 hover:border-gray-400 hover:shadow-md
        dark:bg-gray-800/50 dark:border-gray-700/50
        dark:hover:border-gray-500/70 dark:hover:bg-gray-800/80"
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border
        ${
          device.is_active
            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50"
            : "bg-gray-50 border-gray-200 dark:bg-gray-700/40 dark:border-gray-600/50"
        }`}
      >
        {device.is_active ? (
          <Wifi size={15} className="text-green-600 dark:text-green-500" />
        ) : (
          <WifiOff size={15} className="text-gray-400 dark:text-gray-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">
          {device.name}
        </p>
        <p className="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
          {[device.device_type, device.location].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
      <span className="text-gray-300 dark:text-gray-600 text-lg font-light">›</span>
    </button>
  );

  const SLabel = ({ t }: { t: string }) => (
    <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500">
      {t}
    </p>
  );

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          {isPT ? "Equipamentos" : "Equipment"}
        </h2>
        <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
          {devices.length} {isPT ? "dispositivos cadastrados" : "registered devices"}
        </p>
      </div>
      {devices.length === 0 && (
        <p className="text-center py-12 text-sm text-gray-400 dark:text-gray-500">
          {isPT ? "Nenhum dispositivo cadastrado." : "No devices registered."}
        </p>
      )}
      {active.length > 0 && (
        <div className="mb-6">
          <SLabel t={`${isPT ? "Ativos" : "Active"} (${active.length})`} />
          <div className="flex flex-col gap-2">
            {active.map((d) => (
              <Row key={d.id} device={d} />
            ))}
          </div>
        </div>
      )}
      {inactive.length > 0 && (
        <div>
          <SLabel t={`${isPT ? "Inativos" : "Inactive"} (${inactive.length})`} />
          <div className="flex flex-col gap-2">
            {inactive.map((d) => (
              <Row key={d.id} device={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Device Detail with Widget Grid ───────────────────────────────────────────
function DeviceDetail({
  device,
  signals,
  userId,
  user,
  onBack,
  onEdit,
  onDelete,
  isPT,
}: {
  device: Device;
  signals: Signal[];
  userId: number;
  user: User | null;
  onBack: () => void;
  onEdit?: (device: Device) => void;
  onDelete?: (deviceId: number) => void;
  isPT: boolean;
}) {
  const { preferences, loading: prefsLoading, savePreferences } = usePreferences(userId);
  const isAdmin = user?.type === "admin";

  const deviceKey = device.id.toString();
  const eqPrefs = preferences?.equipment?.[deviceKey];
  const layout = eqPrefs?.layout ?? "2x2";
  const widgets = eqPrefs?.widgets ?? [];

  // Filter signals that belong to this device
  const deviceSignals = signals.filter((s) => s.device_id === device.id);

  const handleLayoutChange = (newLayout: GridLayout) => {
    const updated = {
      ...preferences?.equipment,
      [deviceKey]: { layout: newLayout, widgets },
    };
    savePreferences({ equipment: updated });
  };

  const handleWidgetsChange = (newWidgets: WidgetConfig[]) => {
    const updated = {
      ...preferences?.equipment,
      [deviceKey]: { layout, widgets: newWidgets },
    };
    savePreferences({ equipment: updated });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              border transition-colors
              border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700
              dark:border-gray-700/60 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
          >
            <ArrowLeft size={13} />
            {isPT ? "Voltar" : "Back"}
          </button>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              {device.name}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {[device.device_type, device.location].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => onEdit(device)}
              >
                <Pencil size={13} />
                {isPT ? "Editar" : "Edit"}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-red-600 hover:text-red-700 border-red-200 hover:border-red-400 dark:text-red-400 dark:border-red-800 dark:hover:border-red-600"
                onClick={() => onDelete(device.id)}
              >
                <Trash2 size={13} />
                {isPT ? "Excluir" : "Delete"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Widget Grid */}
      {prefsLoading ? (
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          Loading widgets...
        </div>
      ) : (
        <WidgetGrid
          layout={layout}
          widgets={widgets}
          onLayoutChange={handleLayoutChange}
          onWidgetsChange={handleWidgetsChange}
          signals={deviceSignals}
        />
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EquipmentTab({
  devices,
  signals,
  user,
  userId,
  onEditDevice,
  onDeleteDevice,
}: EquipmentTabProps) {
  const locale = useLocale();
  const isPT = locale === "pt-BR";
  const [selected, setSelected] = useState<Device | null>(null);

  return (
    <div className="max-w-3xl">
      {selected ? (
        <DeviceDetail
          device={selected}
          signals={signals}
          userId={userId}
          user={user}
          onBack={() => setSelected(null)}
          onEdit={onEditDevice}
          onDelete={(id) => {
            onDeleteDevice?.(id);
            setSelected(null);
          }}
          isPT={isPT}
        />
      ) : (
        <DeviceList devices={devices} onSelect={setSelected} isPT={isPT} />
      )}
    </div>
  );
}
