"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetData, getLatestValue } from "./useWidgetData";
import type { WidgetConfig, Timespan } from "@/types/widgets";

interface DigitalStatusWidgetProps {
  config: WidgetConfig;
}

export function DigitalStatusWidget({ config }: DigitalStatusWidgetProps) {
  const signalIds = config.signal_id ? [config.signal_id] : [];

  const { dataMap, loading } = useWidgetData({
    signalIds,
    timespan: (config.timespan ?? "24h") as Timespan,
    autoRefresh: config.auto_refresh ?? true,
    limit: "1",
  });

  const values = config.signal_id ? dataMap[config.signal_id] ?? [] : [];
  const latest = getLatestValue(values);
  const isOn = latest?.digital_value ?? false;

  if (loading && values.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 p-4">
        <Skeleton className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  const onLabel = config.on_label ?? "ON";
  const offLabel = config.off_label ?? "OFF";

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-gray-400 dark:text-gray-500 truncate max-w-full">
        {config.label ?? "Status"}
      </p>
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
          isOn
            ? "bg-green-500/20 border-2 border-green-500"
            : "bg-red-500/20 border-2 border-red-500"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full ${
            isOn ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50"
          } shadow-lg`}
        />
      </div>
      <p
        className={`mt-3 text-sm font-bold ${
          isOn ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {isOn ? onLabel : offLabel}
      </p>
    </div>
  );
}
