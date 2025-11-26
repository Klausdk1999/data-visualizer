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
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { getSignalValues } from "@/lib/requestHandlers";
import type { Signal, SignalValue } from "@/types";

interface SignalValuesTabProps {
  signals: Signal[];
  signalValues: SignalValue[];
  selectedSignal: number | null;
  onAddValue: () => void;
  onDeleteValue: (valueId: number) => void;
}

export default function SignalValuesTab({
  signals,
  signalValues,
  selectedSignal,
  onAddValue,
  onDeleteValue,
}: SignalValuesTabProps) {
  const [graphSignal, setGraphSignal] = useState<number | null>(null);
  const [graphData, setGraphData] = useState<SignalValue[]>([]);

  useEffect(() => {
    if (graphSignal) {
      fetchGraphData(graphSignal);
    }
  }, [graphSignal]);

  const fetchGraphData = async (signalId: number) => {
    try {
      const values = await getSignalValues({
        signal_id: signalId.toString(),
        limit: "100",
      });
      const sortedValues = values.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setGraphData(sortedValues);
    } catch (error) {
      console.error("Error fetching graph data:", error);
    }
  };

  const selectedSignalData = signals.find((s) => s.id === graphSignal);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white">
            Signal Values
            {selectedSignal && ` (Signal ${selectedSignal})`}
          </CardTitle>
          <div className="flex space-x-2">
            <select
              value={graphSignal || ""}
              onChange={(e) => setGraphSignal(e.target.value ? Number(e.target.value) : null)}
              className="h-10 rounded-xl border border-gray-300/50 bg-white/70 backdrop-blur-sm text-gray-900 dark:bg-gray-700/60 dark:border-gray-600/50 dark:text-gray-100 px-3 transition-all"
            >
              <option value="">-- Select signal for graph --</option>
              {signals.map((signal) => (
                <option key={signal.id} value={signal.id}>
                  {signal.name} ({signal.device?.name || signal.device_id})
                </option>
              ))}
            </select>
            <Button
              onClick={onAddValue}
              disabled={!selectedSignal}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Value
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {graphSignal && graphData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">
                Signal Evolution: {selectedSignalData?.name}
              </h3>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={graphData
                      .map((v) => ({
                        timestamp: new Date(v.timestamp).toLocaleString(),
                        value:
                          v.value !== null && v.value !== undefined
                            ? v.value
                            : v.digital_value !== null && v.digital_value !== undefined
                              ? v.digital_value
                                ? 1
                                : 0
                              : null,
                        date: new Date(v.timestamp).getTime(),
                      }))
                      .filter((d) => d.value !== null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#64748B"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#64748B" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(148, 163, 184, 0.3)",
                        color: "#1E293B",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#1E293B" }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: "#3B82F6", r: 3 }}
                      name="Value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
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
