"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TimespanSelector } from "./TimespanSelector";
import { useWidgetData, formatTimestamp } from "./useWidgetData";
import type { WidgetConfig, Timespan } from "@/types/widgets";

interface TableWidgetProps {
  config: WidgetConfig;
}

export function TableWidget({ config }: TableWidgetProps) {
  const [timespan, setTimespan] = useState<Timespan>(config.timespan ?? "24h");
  const [sortAsc, setSortAsc] = useState(false);
  const signalIds = config.signal_id ? [config.signal_id] : [];
  const rowCount = config.row_count ?? 10;

  const { dataMap, loading } = useWidgetData({
    signalIds,
    timespan,
    autoRefresh: config.auto_refresh ?? false,
    limit: String(rowCount * 2), // fetch extra to account for sorting
  });

  const values = config.signal_id ? (dataMap[config.signal_id] ?? []) : [];

  const rows = useMemo(() => {
    const sorted = [...values].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return sortAsc ? ta - tb : tb - ta;
    });
    return sorted.slice(0, rowCount);
  }, [values, sortAsc, rowCount]);

  if (loading && rows.length === 0) {
    return (
      <div className="h-full flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
          {config.label ?? "Table"}
        </span>
        <TimespanSelector value={timespan} onChange={setTimespan} />
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-1.5 px-2 text-gray-500 dark:text-gray-400 font-medium">
                <button
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => setSortAsc((v) => !v)}
                >
                  Timestamp
                  <ArrowUpDown size={10} />
                </button>
              </th>
              <th className="text-right py-1.5 px-2 text-gray-500 dark:text-gray-400 font-medium">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-4 text-center text-gray-400 dark:text-gray-500">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-1.5 px-2 text-gray-700 dark:text-gray-300">
                    {formatTimestamp(v.timestamp)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-gray-900 dark:text-gray-100">
                    {v.value != null
                      ? v.value
                      : v.digital_value != null
                        ? v.digital_value
                          ? "ON"
                          : "OFF"
                        : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
