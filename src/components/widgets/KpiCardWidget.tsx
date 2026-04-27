"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetData, getLatestValue, getPreviousValue } from "./useWidgetData";
import type { WidgetConfig, Timespan } from "@/types/widgets";

interface KpiCardWidgetProps {
  config: WidgetConfig;
}

export function KpiCardWidget({ config }: KpiCardWidgetProps) {
  const signalIds = config.signal_id ? [config.signal_id] : [];

  const { dataMap, loading } = useWidgetData({
    signalIds,
    timespan: (config.timespan ?? "24h") as Timespan,
    autoRefresh: config.auto_refresh ?? true,
    limit: "10",
  });

  const values = config.signal_id ? (dataMap[config.signal_id] ?? []) : [];
  const latest = getLatestValue(values);
  const previous = getPreviousValue(values);

  const currentValue = latest?.value ?? null;
  const previousValue = previous?.value ?? null;

  let trend: "up" | "down" | "flat" | null = null;
  if (currentValue != null && previousValue != null) {
    if (currentValue > previousValue) trend = "up";
    else if (currentValue < previousValue) trend = "down";
    else trend = "flat";
  }

  if (loading && values.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 p-4">
        <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-10 w-28 bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400 dark:text-gray-500 truncate max-w-full">
        {config.label ?? "KPI"}
      </p>
      {currentValue != null ? (
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {currentValue.toFixed(1)}
          </p>
          {config.unit && (
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
              {config.unit}
            </span>
          )}
        </div>
      ) : (
        <p className="text-3xl font-bold text-gray-300 dark:text-gray-600">&mdash;</p>
      )}
      {trend && (
        <div
          className={`flex items-center gap-1 mt-2 text-xs font-medium ${
            trend === "up"
              ? "text-green-600 dark:text-green-400"
              : trend === "down"
                ? "text-red-600 dark:text-red-400"
                : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {trend === "up" && <TrendingUp size={14} />}
          {trend === "down" && <TrendingDown size={14} />}
          {trend === "flat" && <Minus size={14} />}
          <span>
            {trend === "up" ? "Up" : trend === "down" ? "Down" : "Stable"}
            {previousValue != null && currentValue != null && trend !== "flat" && (
              <> ({Math.abs(currentValue - previousValue).toFixed(1)})</>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
