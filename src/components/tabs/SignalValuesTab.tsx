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
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">
            Signal Values
            {selectedSignal && ` (Signal ${selectedSignal})`}
          </CardTitle>
          <div className="flex space-x-2">
            <select
              value={graphSignal || ""}
              onChange={(e) => setGraphSignal(e.target.value ? Number(e.target.value) : null)}
              className="h-10 rounded-md border border-gray-600 bg-gray-800 text-white px-3"
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
              <h3 className="text-white text-lg font-semibold mb-4">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#9CA3AF"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#374151",
                        border: "1px solid #4B5563",
                        color: "#F3F4F6",
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#F3F4F6" }} />
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
              <TableRow className="border-gray-600">
                <TableHead className="text-white">ID</TableHead>
                <TableHead className="text-white">Timestamp</TableHead>
                <TableHead className="text-white">Signal</TableHead>
                <TableHead className="text-white">Value</TableHead>
                <TableHead className="text-white">Digital</TableHead>
                <TableHead className="text-white">User</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {signalValues.map((value) => (
                <TableRow key={value.id} className="border-gray-600 hover:bg-gray-600">
                  <TableCell className="text-white">{value.id}</TableCell>
                  <TableCell className="text-white">
                    {new Date(value.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-white">
                    {value.signal?.name || value.signal_id}
                  </TableCell>
                  <TableCell className="text-white">
                    {value.value !== null && value.value !== undefined ? value.value : "-"}
                  </TableCell>
                  <TableCell className="text-white">
                    {value.digital_value !== null && value.digital_value !== undefined
                      ? value.digital_value.toString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-white">
                    {value.user?.name || value.user_id || "-"}
                  </TableCell>
                  <TableCell className="text-white">
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
