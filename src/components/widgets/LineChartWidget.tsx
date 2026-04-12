"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TimespanSelector } from "./TimespanSelector";
import { useWidgetData, formatShortTime } from "./useWidgetData";
import type { WidgetConfig, Timespan } from "@/types/widgets";
import type { Signal } from "@/types";

const CHART_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
];

interface LineChartWidgetProps {
  config: WidgetConfig;
  signals?: Signal[];
}

export function LineChartWidget({ config, signals = [] }: LineChartWidgetProps) {
  const [timespan, setTimespan] = useState<Timespan>(config.timespan ?? "24h");
  const [autoRefresh, setAutoRefresh] = useState(config.auto_refresh ?? false);
  const signalIds = config.signals ?? (config.signal_id ? [config.signal_id] : []);

  const { dataMap, loading, refresh } = useWidgetData({
    signalIds,
    timespan,
    autoRefresh,
  });

  const chartData = useMemo(() => {
    const timestampMap = new Map<number, Record<string, number | string>>();
    signalIds.forEach((signalId) => {
      const values = dataMap[signalId] ?? [];
      values.forEach((v) => {
        const ts = new Date(v.timestamp).getTime();
        const existing = timestampMap.get(ts) || {
          time: formatShortTime(v.timestamp),
          _ts: ts,
        };
        const val =
          v.value != null ? v.value : v.digital_value != null ? (v.digital_value ? 1 : 0) : null;
        if (val !== null) existing[`s_${signalId}`] = val;
        timestampMap.set(ts, existing);
      });
    });
    return Array.from(timestampMap.values()).sort(
      (a, b) => (a._ts as number) - (b._ts as number)
    );
  }, [dataMap, signalIds]);

  if (loading && chartData.length === 0) {
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
          {config.label ?? "Line Chart"}
        </span>
        <div className="flex items-center gap-1">
          <TimespanSelector value={timespan} onChange={setTimespan} />
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 ${autoRefresh ? "text-blue-500" : "text-gray-400"}`}
            onClick={() => setAutoRefresh((v) => !v)}
            title={autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
          >
            <RefreshCw size={12} className={autoRefresh ? "animate-spin" : ""} />
          </Button>
          {!autoRefresh && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={refresh}>
              <RefreshCw size={12} />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-100 dark:text-gray-700/50"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                className="fill-gray-400 dark:fill-gray-500"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
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
              {signalIds.length > 1 && <Legend wrapperStyle={{ fontSize: "11px" }} />}
              {signalIds.map((id, i) => {
                const sig = signals.find((s) => s.id === id);
                return (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={`s_${id}`}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                    name={sig?.name ?? `Signal ${id}`}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
