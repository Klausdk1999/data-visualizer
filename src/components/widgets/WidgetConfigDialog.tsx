"use client";

import React, { useState } from "react";
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
import { SearchableSelect } from "@/components/ui/combobox";
import {
  LineChart as LineChartIcon,
  BarChart3,
  Gauge,
  Activity,
  ToggleLeft,
  Table2,
  ArrowLeft,
} from "lucide-react";
import type { WidgetConfig, WidgetType, Timespan } from "@/types/widgets";
import type { Signal } from "@/types";
import { ALL_TIMESPANS, TIMESPAN_LABELS } from "./useWidgetData";

interface WidgetConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signals: Signal[];
  onSave: (config: WidgetConfig) => void;
  editConfig?: WidgetConfig | null;
}

const WIDGET_TYPES: {
  type: WidgetType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "line_chart",
    label: "Line Chart",
    description: "Time-series line chart",
    icon: <LineChartIcon size={24} />,
  },
  {
    type: "bar_chart",
    label: "Bar Chart",
    description: "Aggregated bar chart",
    icon: <BarChart3 size={24} />,
  },
  {
    type: "gauge",
    label: "Gauge",
    description: "Circular gauge indicator",
    icon: <Gauge size={24} />,
  },
  {
    type: "kpi_card",
    label: "KPI Card",
    description: "Large number with trend",
    icon: <Activity size={24} />,
  },
  {
    type: "digital_status",
    label: "Digital Status",
    description: "On/off status indicator",
    icon: <ToggleLeft size={24} />,
  },
  {
    type: "table",
    label: "Table",
    description: "Recent values table",
    icon: <Table2 size={24} />,
  },
];

const MULTI_SIGNAL_TYPES: WidgetType[] = ["line_chart", "bar_chart"];
const SINGLE_SIGNAL_TYPES: WidgetType[] = ["gauge", "kpi_card", "digital_status", "table"];

export function WidgetConfigDialog({
  open,
  onOpenChange,
  signals,
  onSave,
  editConfig,
}: WidgetConfigDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(editConfig ? 3 : 1);
  const [widgetType, setWidgetType] = useState<WidgetType>(editConfig?.type ?? "line_chart");
  const [selectedSignals, setSelectedSignals] = useState<number[]>(
    editConfig?.signals ?? (editConfig?.signal_id ? [editConfig.signal_id] : [])
  );
  const [label, setLabel] = useState(editConfig?.label ?? "");
  const [unit, setUnit] = useState(editConfig?.unit ?? "");
  const [timespan, setTimespan] = useState<Timespan>(editConfig?.timespan ?? "24h");
  const [min, setMin] = useState<string>(editConfig?.min?.toString() ?? "0");
  const [max, setMax] = useState<string>(editConfig?.max?.toString() ?? "100");
  const [onLabel, setOnLabel] = useState(editConfig?.on_label ?? "ON");
  const [offLabel, setOffLabel] = useState(editConfig?.off_label ?? "OFF");
  const [rowCount, setRowCount] = useState<string>(editConfig?.row_count?.toString() ?? "10");
  const [autoRefresh, setAutoRefresh] = useState(editConfig?.auto_refresh ?? false);

  const isMultiSignal = MULTI_SIGNAL_TYPES.includes(widgetType);

  const signalOptions = signals.map((s) => ({
    value: s.id.toString(),
    label: `${s.name} (${s.device?.name ?? `Device ${s.device_id}`})`,
  }));

  const reset = () => {
    setStep(1);
    setWidgetType("line_chart");
    setSelectedSignals([]);
    setLabel("");
    setUnit("");
    setTimespan("24h");
    setMin("0");
    setMax("100");
    setOnLabel("ON");
    setOffLabel("OFF");
    setRowCount("10");
    setAutoRefresh(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleSelectType = (type: WidgetType) => {
    setWidgetType(type);
    setStep(2);
  };

  const handleSave = () => {
    const config: WidgetConfig = {
      id: editConfig?.id ?? crypto.randomUUID(),
      type: widgetType,
      label: label || WIDGET_TYPES.find((w) => w.type === widgetType)?.label,
      timespan,
      auto_refresh: autoRefresh,
    };

    if (isMultiSignal) {
      config.signals = selectedSignals;
    } else if (selectedSignals.length > 0) {
      config.signal_id = selectedSignals[0];
    }

    if (widgetType === "gauge" || widgetType === "kpi_card") {
      config.unit = unit || undefined;
    }

    if (widgetType === "gauge") {
      config.min = parseFloat(min) || 0;
      config.max = parseFloat(max) || 100;
    }

    if (widgetType === "digital_status") {
      config.on_label = onLabel;
      config.off_label = offLabel;
    }

    if (widgetType === "table") {
      config.row_count = parseInt(rowCount) || 10;
    }

    onSave(config);
    handleClose(false);
  };

  const toggleSignal = (id: number) => {
    if (isMultiSignal) {
      setSelectedSignals((prev) =>
        prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
      );
    } else {
      setSelectedSignals([id]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editConfig ? "Edit Widget" : "Add Widget"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Pick widget type */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {WIDGET_TYPES.map((wt) => (
              <button
                key={wt.type}
                onClick={() => handleSelectType(wt.type)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all
                  ${
                    widgetType === wt.type
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                  }
                  text-gray-700 dark:text-gray-300`}
              >
                {wt.icon}
                <span className="text-xs font-medium">{wt.label}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {wt.description}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Pick signal(s) */}
        {step === 2 && (
          <div className="mt-2 space-y-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft size={14} />
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Select signal{isMultiSignal ? "(s)" : ""}
              </span>
            </div>
            {isMultiSignal ? (
              <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto p-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl">
                {signals.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">No signals available</p>
                ) : (
                  signals.map((sig) => {
                    const isSelected = selectedSignals.includes(sig.id);
                    return (
                      <button
                        key={sig.id}
                        type="button"
                        onClick={() => toggleSignal(sig.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                        }`}
                      >
                        {sig.name}
                        <span className="opacity-70 ml-1">
                          ({sig.device?.name ?? `D${sig.device_id}`})
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <SearchableSelect
                options={signalOptions}
                value={selectedSignals[0]?.toString() ?? ""}
                onChange={(val) => setSelectedSignals(val ? [parseInt(val)] : [])}
                placeholder="Select a signal..."
                searchPlaceholder="Search signals..."
                notFoundText="No signals found"
              />
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => setStep(3)}
                disabled={selectedSignals.length === 0}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Configure parameters */}
        {step === 3 && (
          <div className="mt-2 space-y-4">
            {!editConfig && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  <ArrowLeft size={14} />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">Configure</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Label */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Label</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={WIDGET_TYPES.find((w) => w.type === widgetType)?.label}
                  className="mt-1"
                />
              </div>

              {/* Timespan */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Time Range</Label>
                <div className="flex gap-1 mt-1">
                  {ALL_TIMESPANS.map((ts) => (
                    <Button
                      key={ts}
                      variant={timespan === ts ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimespan(ts)}
                    >
                      {TIMESPAN_LABELS[ts]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Unit for gauge/kpi */}
              {(widgetType === "gauge" || widgetType === "kpi_card") && (
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Unit</Label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. A, W, C"
                    className="mt-1"
                  />
                </div>
              )}

              {/* Min/Max for gauge */}
              {widgetType === "gauge" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Min</Label>
                    <Input
                      type="number"
                      value={min}
                      onChange={(e) => setMin(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Max</Label>
                    <Input
                      type="number"
                      value={max}
                      onChange={(e) => setMax(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* On/Off labels for digital status */}
              {widgetType === "digital_status" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">On Label</Label>
                    <Input
                      value={onLabel}
                      onChange={(e) => setOnLabel(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">Off Label</Label>
                    <Input
                      value={offLabel}
                      onChange={(e) => setOffLabel(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Row count for table */}
              {widgetType === "table" && (
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Row Count</Label>
                  <Input
                    type="number"
                    value={rowCount}
                    onChange={(e) => setRowCount(e.target.value)}
                    min="1"
                    max="100"
                    className="mt-1"
                  />
                </div>
              )}

              {/* Auto refresh */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <Label htmlFor="auto-refresh" className="text-gray-700 dark:text-gray-300">
                  Auto-refresh (every 30s)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={selectedSignals.length === 0}>
                {editConfig ? "Update" : "Add Widget"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
