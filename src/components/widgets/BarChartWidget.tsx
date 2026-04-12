"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TimespanSelector } from "./TimespanSelector";
import { useWidgetData, getLatestValue } from "./useWidgetData";
import type { WidgetConfig, Timespan } from "@/types/widgets";
import type { Signal } from "@/types";

const CHART_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
];

interface BarChartWidgetProps {
  config: WidgetConfig;
  signals?: Signal[];
}

export function BarChartWidget({ config, signals = [] }: BarChartWidgetProps) {
  const [timespan, setTimespan] = useState<Timespan>(config.timespan ?? "24h");
  const signalIds = config.signals ?? (config.signal_id ? [config.signal_id] : []);

  const { dataMap, loading } = useWidgetData({
    signalIds,
    timespan,
    autoRefresh: config.auto_refresh ?? false,
  });

  const barData = useMemo(() => {
    return signalIds.map((id) => {
      const values = dataMap[id] ?? [];
      const latest = getLatestValue(values);
      const sig = signals.find((s) => s.id === id);
      return {
        name: sig?.name ?? `Signal ${id}`,
        value: latest?.value != null ? latest.value : latest?.digital_value ? 1 : 0,
      };
    });
  }, [dataMap, signalIds, signals]);

  if (loading && barData.length === 0) {
    return (
      <div className="h-full flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
          {config.label ?? "Bar Chart"}
        </span>
        <TimespanSelector value={timespan} onChange={setTimespan} />
      </div>
      <div className="flex-1 min-h-0">
        {barData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-100 dark:text-gray-700/50"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                className="fill-gray-400 dark:fill-gray-500"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                className="fill-gray-400 dark:fill-gray-500"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(148,163,184,0.3)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
