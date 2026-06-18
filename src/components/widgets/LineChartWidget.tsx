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

import { RefreshCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimespanSelector } from "./TimespanSelector";

import { useWidgetData, formatTimeForAxis, CHART_COLORS } from "./useWidgetData";
import type { WidgetConfig, Timespan } from "@/types/widgets";
import type { Signal } from "@/types";

interface LineChartWidgetProps {
  config: WidgetConfig;
  signals?: Signal[];
}

export function LineChartWidget({ config, signals = [] }: LineChartWidgetProps) {
  const [timespan, setTimespan] = useState<Timespan>(config.timespan ?? "24h");
  const [autoRefresh, setAutoRefresh] = useState(config.auto_refresh ?? false);
  const [expanded, setExpanded] = useState(false);
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
          time: formatTimeForAxis(v.timestamp, timespan),
          _ts: ts,
        };
        const val =
          v.value != null ? v.value : v.digital_value != null ? (v.digital_value ? 1 : 0) : null;
        if (val !== null) existing[`s_${signalId}`] = val;
        timestampMap.set(ts, existing);
      });
    });

    return Array.from(timestampMap.values()).sort((a, b) => (a._ts as number) - (b._ts as number));
 
  }, [dataMap, signalIds, timespan]);

  if (loading && chartData.length === 0) {
    return (
      <div className="h-full flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
  
    <div className="h-full flex flex-col p-3 pt-7">
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
           
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-500" onClick={refresh}>
              <RefreshCw size={12} />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-500" onClick={() => setExpanded(true)}>
            <Maximize2 size={12} />
          </Button>
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

      {/* Expanded Modal View */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{config.label ?? "Line Chart"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
            {/* Chart container */}
            <div className="h-[50%] min-h-[300px] w-full border rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12 }}
                    className="fill-gray-500 dark:fill-gray-400"
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} className="fill-gray-500 dark:fill-gray-400" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(148,163,184,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  {signalIds.map((id, i) => {
                    const sig = signals.find((s) => s.id === id);
                    return (
                      <Line
                        key={id}
                        type="monotone"
                        dataKey={`s_${id}`}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 2, strokeWidth: 1 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        name={sig?.name ?? `Signal ${id}`}
                        connectNulls
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Table container */}
            <div className="flex-1 overflow-auto border rounded-xl bg-white dark:bg-gray-900 shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800/80 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[180px] font-semibold text-gray-900 dark:text-gray-100">Timestamp</TableHead>
                    {signalIds.map((id) => (
                      <TableHead key={id} className="font-semibold text-gray-900 dark:text-gray-100">
                        {signals.find((s) => s.id === id)?.name ?? `Signal ${id}`}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={signalIds.length + 1} className="h-24 text-center text-gray-500">
                        No data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    chartData.map((row, i) => (
                      <TableRow key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <TableCell className="font-medium text-gray-600 dark:text-gray-400">
                          {new Date(row._ts as number).toLocaleString()}
                        </TableCell>
                        {signalIds.map((id) => (
                          <TableCell key={id} className="text-gray-700 dark:text-gray-300">
                            {row[`s_${id}`] !== undefined ? String(row[`s_${id}`]) : "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
