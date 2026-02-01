"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Trash2, Clock, Calendar } from "lucide-react";
import { getSignalValues } from "@/lib/requestHandlers";
import type { Signal, SignalValue } from "@/types";

const CHART_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

const TIMESPAN_OPTIONS = [
  { value: "1h", label: "Last 1 hour" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

interface SignalValuesTabProps {
  signals: Signal[];
  signalValues: SignalValue[];
  selectedSignal: number | null;
  onAddValue: () => void;
  onDeleteValue: (valueId: number) => void;
}

function getDateRangeFromTimespan(timespan: string): { from: Date; to: Date } {
  const now = new Date();
  const to = now;
  let from: Date;

  switch (timespan) {
    case "1h":
      from = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "24h":
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return { from, to };
}

export default function SignalValuesTab({
  signals,
  signalValues,
  selectedSignal,
  onAddValue,
  onDeleteValue,
}: SignalValuesTabProps) {
  const [selectedSignals, setSelectedSignals] = useState<number[]>([]);
  const [timespan, setTimespan] = useState("24h");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [graphDataMap, setGraphDataMap] = useState<Record<number, SignalValue[]>>({});
  const [loading, setLoading] = useState(false);

  // Fetch data when selection or time range changes
  useEffect(() => {
    if (selectedSignals.length === 0) {
      setGraphDataMap({});
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const newDataMap: Record<number, SignalValue[]> = {};

        let fromDateStr: string | undefined;
        let toDateStr: string | undefined;

        if (timespan === "custom") {
          fromDateStr = fromDate || undefined;
          toDateStr = toDate || undefined;
        } else {
          const { from, to } = getDateRangeFromTimespan(timespan);
          fromDateStr = from.toISOString();
          toDateStr = to.toISOString();
        }

        await Promise.all(
          selectedSignals.map(async (signalId) => {
            const params: Record<string, string> = {
              signal_id: signalId.toString(),
            };
            if (fromDateStr) params.from_date = fromDateStr;
            if (toDateStr) params.to_date = toDateStr;

            const values = await getSignalValues(params);
            newDataMap[signalId] = values.sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          })
        );

        setGraphDataMap(newDataMap);
      } catch (error) {
        console.error("Error fetching graph data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSignals, timespan, fromDate, toDate]);

  // Toggle signal selection
  const handleSignalToggle = (signalId: number) => {
    setSelectedSignals((prev) =>
      prev.includes(signalId) ? prev.filter((id) => id !== signalId) : [...prev, signalId]
    );
  };

  // Handle timespan change
  const handleTimespanChange = (newTimespan: string) => {
    setTimespan(newTimespan);
    if (newTimespan !== "custom") {
      setFromDate("");
      setToDate("");
    }
  };

  // Build chart data from all selected signals
  const getChartData = () => {
    if (selectedSignals.length === 0) return [];

    const timestampMap = new Map<number, Record<string, number | string>>();

    selectedSignals.forEach((signalId) => {
      const signalData = graphDataMap[signalId] || [];
      signalData.forEach((v) => {
        const ts = new Date(v.timestamp).getTime();
        const existing = timestampMap.get(ts) || {
          timestamp: new Date(v.timestamp).toLocaleString(),
          date: ts,
        };

        const value =
          v.value !== null && v.value !== undefined
            ? v.value
            : v.digital_value !== null && v.digital_value !== undefined
              ? v.digital_value
                ? 1
                : 0
              : null;

        if (value !== null) {
          existing[`signal_${signalId}`] = value;
        }
        timestampMap.set(ts, existing);
      });
    });

    return Array.from(timestampMap.values()).sort(
      (a, b) => (a.date as number) - (b.date as number)
    );
  };

  const chartData = getChartData();

  return (
    <div className="space-y-4">
      {/* Time Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {TIMESPAN_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={timespan === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimespanChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {timespan === "custom" && (
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
                <input
                  type="datetime-local"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 rounded-lg border border-gray-300/50 bg-white/70 backdrop-blur-sm text-gray-900 dark:bg-gray-700/60 dark:border-gray-600/50 dark:text-gray-100 px-3 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
                <input
                  type="datetime-local"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 rounded-lg border border-gray-300/50 bg-white/70 backdrop-blur-sm text-gray-900 dark:bg-gray-700/60 dark:border-gray-600/50 dark:text-gray-100 px-3 text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signal Selection and Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white">Signal Values</CardTitle>
          <Button
            onClick={onAddValue}
            disabled={!selectedSignal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Value
          </Button>
        </CardHeader>
        <CardContent>
          {/* Signal Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select signals to display on chart:
            </h3>
            <div className="flex flex-wrap gap-3 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl">
              {signals.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No signals available. Create signals in the Signal Configurations tab first.
                </p>
              ) : (
                signals.map((signal) => {
                  const isSelected = selectedSignals.includes(signal.id);
                  const colorIndex = selectedSignals.indexOf(signal.id);
                  const color = isSelected
                    ? CHART_COLORS[colorIndex % CHART_COLORS.length]
                    : undefined;

                  return (
                    <button
                      key={signal.id}
                      type="button"
                      onClick={() => handleSignalToggle(signal.id)}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                        flex items-center gap-2 border
                        ${
                          isSelected
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                        }
                      `}
                    >
                      {isSelected && (
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      )}
                      {signal.name}
                      <span className="text-xs opacity-70">
                        ({signal.device?.name || `Device ${signal.device_id}`})
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chart */}
          {selectedSignals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">
                Signal Evolution
                {loading && (
                  <span className="text-sm font-normal text-gray-500 ml-2">(Loading...)</span>
                )}
              </h3>
              {chartData.length > 0 ? (
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                      <XAxis
                        dataKey="timestamp"
                        stroke="#64748B"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis stroke="#64748B" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(148, 163, 184, 0.3)",
                          color: "#1E293B",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend wrapperStyle={{ color: "#1E293B" }} />
                      {selectedSignals.map((signalId, index) => {
                        const signal = signals.find((s) => s.id === signalId);
                        return (
                          <Line
                            key={signalId}
                            type="monotone"
                            dataKey={`signal_${signalId}`}
                            stroke={CHART_COLORS[index % CHART_COLORS.length]}
                            strokeWidth={2}
                            dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], r: 3 }}
                            name={signal?.name || `Signal ${signalId}`}
                            connectNulls
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl">
                  {loading ? "Loading data..." : "No data available for the selected time range"}
                </div>
              )}
            </div>
          )}

          {/* Data Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Digital</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {signalValues.map((value) => (
                <TableRow key={value.id}>
                  <TableCell className="text-gray-900 dark:text-gray-100">{value.id}</TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {new Date(value.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {value.signal?.name || value.signal_id}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {value.value !== null && value.value !== undefined ? value.value : "-"}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {value.digital_value !== null && value.digital_value !== undefined
                      ? value.digital_value.toString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {value.user?.name || value.user_id || "-"}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteValue(value.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
