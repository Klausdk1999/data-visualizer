"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings, X, Grid2X2, Columns2, Rows2, Square } from "lucide-react";
import { LineChartWidget } from "./LineChartWidget";
import { BarChartWidget } from "./BarChartWidget";
import { GaugeWidget } from "./GaugeWidget";
import { KpiCardWidget } from "./KpiCardWidget";
import { DigitalStatusWidget } from "./DigitalStatusWidget";
import { TableWidget } from "./TableWidget";
import { WidgetConfigDialog } from "./WidgetConfigDialog";
import type { WidgetConfig, GridLayout } from "@/types/widgets";
import type { Signal } from "@/types";

interface WidgetGridProps {
  layout: GridLayout;
  widgets: WidgetConfig[];
  onLayoutChange: (layout: GridLayout) => void;
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  signals: Signal[];
  editable?: boolean;
}

const LAYOUT_MAX_CELLS: Record<GridLayout, number> = {
  "1x1": 1,
  "1x2": 2,
  "2x1": 2,
  "2x2": 4,
};

const LAYOUT_GRID_CLASS: Record<GridLayout, string> = {
  "1x1": "grid-cols-1 grid-rows-1",
  "1x2": "grid-cols-2 grid-rows-1",
  "2x1": "grid-cols-1 grid-rows-2",
  "2x2": "grid-cols-2 grid-rows-2",
};

const LAYOUT_OPTIONS: { value: GridLayout; label: string; icon: React.ReactNode }[] = [
  { value: "1x1", label: "1x1", icon: <Square size={16} /> },
  { value: "1x2", label: "1x2", icon: <Columns2 size={16} /> },
  { value: "2x1", label: "2x1", icon: <Rows2 size={16} /> },
  { value: "2x2", label: "2x2", icon: <Grid2X2 size={16} /> },
];

function renderWidget(config: WidgetConfig, signals: Signal[]) {
  switch (config.type) {
    case "line_chart":
      return <LineChartWidget config={config} signals={signals} />;
    case "bar_chart":
      return <BarChartWidget config={config} signals={signals} />;
    case "gauge":
      return <GaugeWidget config={config} />;
    case "kpi_card":
      return <KpiCardWidget config={config} />;
    case "digital_status":
      return <DigitalStatusWidget config={config} />;
    case "table":
      return <TableWidget config={config} />;
    default:
      return <div className="p-4 text-sm text-gray-400">Unknown widget type</div>;
  }
}

export function WidgetGrid({
  layout,
  widgets,
  onLayoutChange,
  onWidgetsChange,
  signals,
  editable = true,
}: WidgetGridProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);

  const maxCells = LAYOUT_MAX_CELLS[layout];

  const handleAddWidget = (config: WidgetConfig) => {
    if (widgets.length < maxCells) {
      onWidgetsChange([...widgets, config]);
    }
  };

  const handleEditWidget = (config: WidgetConfig) => {
    onWidgetsChange(widgets.map((w) => (w.id === config.id ? config : w)));
    setEditingWidget(null);
  };

  const handleRemoveWidget = (id: string) => {
    onWidgetsChange(widgets.filter((w) => w.id !== id));
  };

  const handleLayoutChange = (newLayout: GridLayout) => {
    const newMax = LAYOUT_MAX_CELLS[newLayout];
    // Trim widgets if new layout has fewer cells
    const trimmed = widgets.slice(0, newMax);
    onLayoutChange(newLayout);
    if (trimmed.length !== widgets.length) {
      onWidgetsChange(trimmed);
    }
  };

  // Build cells: existing widgets + empty slots
  const cells: (WidgetConfig | null)[] = [];
  for (let i = 0; i < maxCells; i++) {
    cells.push(widgets[i] ?? null);
  }

  return (
    <div className="space-y-3">
      {/* Layout picker */}
      {editable && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Layout:</span>
          <div className="flex gap-1">
            {LAYOUT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={layout === opt.value ? "default" : "outline"}
                size="sm"
                className="h-7 px-2 gap-1"
                onClick={() => handleLayoutChange(opt.value)}
              >
                {opt.icon}
                <span className="text-xs">{opt.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className={`grid gap-4 ${LAYOUT_GRID_CLASS[layout]}`}>
        {cells.map((widget, i) =>
          widget ? (
            <Card
              key={widget.id}
              className="relative overflow-hidden border-gray-200/70 dark:border-gray-700/50 dark:bg-gray-800/50 group min-h-[320px]"
            >
              {/* Edit/Remove controls */}
              {editable && (
                <div className="absolute top-1 right-1 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingWidget(widget)}
                    className="p-1 rounded-md bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Edit widget"
                  >
                    <Settings size={12} className="text-gray-500 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleRemoveWidget(widget.id)}
                    className="p-1 rounded-md bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove widget"
                  >
                    <X size={12} className="text-gray-500 dark:text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              )}
              {renderWidget(widget, signals)}
            </Card>
          ) : editable ? (
            <button
              key={`empty-${i}`}
              onClick={() => setAddDialogOpen(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed
                border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500
                text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300
                transition-all bg-transparent min-h-[320px]"
            >
              <Plus size={24} />
              <span className="text-xs font-medium">Add Widget</span>
            </button>
          ) : (
            <div
              key={`empty-${i}`}
              className="rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 min-h-[320px]"
            />
          )
        )}
      </div>

      {/* Add Widget Dialog */}
      <WidgetConfigDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        signals={signals}
        onSave={handleAddWidget}
      />

      {/* Edit Widget Dialog */}
      {editingWidget && (
        <WidgetConfigDialog
          open={true}
          onOpenChange={(o) => {
            if (!o) setEditingWidget(null);
          }}
          signals={signals}
          onSave={handleEditWidget}
          editConfig={editingWidget}
        />
      )}
    </div>
  );
}
