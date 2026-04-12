import { useState, useEffect, useCallback, useRef } from "react";
import { getSignalValues } from "@/lib/requestHandlers";
import type { SignalValue } from "@/types";
import type { Timespan } from "@/types/widgets";

const TIMESPAN_MS: Record<Timespan, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export const TIMESPAN_LABELS: Record<Timespan, string> = {
  "1h": "1h",
  "6h": "6h",
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
};

export const ALL_TIMESPANS: Timespan[] = ["1h", "6h", "24h", "7d", "30d"];

export function getTimespanRange(timespan: Timespan): { from_date: string; to_date: string } {
  const now = new Date();
  const from = new Date(now.getTime() - TIMESPAN_MS[timespan]);
  return { from_date: from.toISOString(), to_date: now.toISOString() };
}

interface UseWidgetDataOptions {
  signalIds: number[];
  timespan: Timespan;
  autoRefresh: boolean;
  limit?: string;
}

interface UseWidgetDataResult {
  dataMap: Record<number, SignalValue[]>;
  loading: boolean;
  refresh: () => void;
}

export function useWidgetData({
  signalIds,
  timespan,
  autoRefresh,
  limit,
}: UseWidgetDataOptions): UseWidgetDataResult {
  const [dataMap, setDataMap] = useState<Record<number, SignalValue[]>>({});
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (signalIds.length === 0) {
      setDataMap({});
      return;
    }
    setLoading(true);
    try {
      const { from_date, to_date } = getTimespanRange(timespan);
      const newMap: Record<number, SignalValue[]> = {};
      await Promise.all(
        signalIds.map(async (id) => {
          const params: Record<string, string> = {
            signal_id: id.toString(),
            from_date,
            to_date,
          };
          if (limit) params.limit = limit;
          const values = await getSignalValues(params);
          newMap[id] = values.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        })
      );
      setDataMap(newMap);
    } catch (error) {
      console.error("Error fetching widget data:", error);
    } finally {
      setLoading(false);
    }
  }, [signalIds, timespan, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 30_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchData]);

  return { dataMap, loading, refresh: fetchData };
}

/** Get latest value from a signal's data array */
export function getLatestValue(values: SignalValue[]): SignalValue | undefined {
  if (values.length === 0) return undefined;
  return values[values.length - 1];
}

/** Get the previous value (second to last) */
export function getPreviousValue(values: SignalValue[]): SignalValue | undefined {
  if (values.length < 2) return undefined;
  return values[values.length - 2];
}

/** Format a timestamp for display */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Short time format for chart axes */
export function formatShortTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
