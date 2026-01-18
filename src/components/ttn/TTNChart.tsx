"use client";

import React from "react";
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
import type { TTNUplink, TTNParameter } from "@/types/ttn";

interface TTNChartProps {
  data: TTNUplink[];
  parameter: TTNParameter;
}

export default function TTNChart({ data, parameter }: TTNChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
        No data available for the selected date range
      </div>
    );
  }

  // Transform data for chart (sort by timestamp)
  const chartData = [...data]
    .sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime())
    .map((uplink) => ({
      timestamp: new Date(uplink.received_at).toLocaleString(),
      distance: uplink.distance_cm,
      battery: uplink.battery_percent,
      temperature: uplink.temperature,
      signal: uplink.signal_strength,
    }));

  const yAxisKey = parameter === "distance" ? "distance" : "battery";
  const yAxisLabel = parameter === "distance" ? "Distance (cm)" : "Battery (%)";
  const lineColor = parameter === "distance" ? "#3b82f6" : "#10b981";

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="timestamp"
          stroke="#6b7280"
          tick={{ fill: "#6b7280" }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          label={{ value: yAxisLabel, angle: -90, position: "insideLeft", fill: "#6b7280" }}
          stroke="#6b7280"
          tick={{ fill: "#6b7280" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "8px",
          }}
          labelStyle={{ color: "#374151" }}
          formatter={(value: number, name: string) => {
            if (name === "distance") return [`${value.toFixed(2)} cm`, "Distance"];
            if (name === "battery") return [`${value}%`, "Battery"];
            if (name === "temperature") return [`${value}°C`, "Temperature"];
            return [value, name];
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey={yAxisKey}
          stroke={lineColor}
          strokeWidth={2}
          dot={{ r: 3 }}
          name={yAxisLabel}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
