"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetData, getLatestValue } from "./useWidgetData";
import type { WidgetConfig, Timespan } from "@/types/widgets";

interface GaugeWidgetProps {
  config: WidgetConfig;
}

function getGaugeColor(ratio: number): string {
  if (ratio < 0.6) return "#10B981"; // green
  if (ratio < 0.8) return "#F59E0B"; // yellow
  return "#EF4444"; // red
}

export function GaugeWidget({ config }: GaugeWidgetProps) {
  const signalIds = config.signal_id ? [config.signal_id] : [];
  const min = config.min ?? 0;
  const max = config.max ?? 100;

  const { dataMap, loading } = useWidgetData({
    signalIds,
    timespan: (config.timespan ?? "24h") as Timespan,
    autoRefresh: config.auto_refresh ?? true,
    limit: "1",
  });

  const values = config.signal_id ? (dataMap[config.signal_id] ?? []) : [];
  const latest = getLatestValue(values);
  const currentValue = latest?.value ?? 0;

  // Gauge geometry
  const cx = 80;
  const cy = 75;
  const r = 60;
  const startAngle = 225; // degrees from positive x-axis (bottom-left)
  const endAngle = -45; // (bottom-right)
  const totalAngle = 270;

  const ratio = Math.max(0, Math.min(1, (currentValue - min) / (max - min)));
  const valueAngle = startAngle - ratio * totalAngle;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcStart = {
    x: cx + r * Math.cos(toRad(startAngle)),
    y: cy - r * Math.sin(toRad(startAngle)),
  };
  const arcEnd = {
    x: cx + r * Math.cos(toRad(endAngle)),
    y: cy - r * Math.sin(toRad(endAngle)),
  };
  const valuePoint = {
    x: cx + r * Math.cos(toRad(valueAngle)),
    y: cy - r * Math.sin(toRad(valueAngle)),
  };

  // SVG arc path helper
  const describeArc = (startDeg: number, endDeg: number) => {
    const start = { x: cx + r * Math.cos(toRad(startDeg)), y: cy - r * Math.sin(toRad(startDeg)) };
    const end = { x: cx + r * Math.cos(toRad(endDeg)), y: cy - r * Math.sin(toRad(endDeg)) };
    const sweep = startDeg - endDeg;
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const color = getGaugeColor(ratio);

  if (loading && values.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 p-3">
        <Skeleton className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-3">
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 truncate max-w-full">
        {config.label ?? "Gauge"}
      </span>
      <svg viewBox="0 0 160 110" className="w-full max-w-[200px]">
        {/* Background arc */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Value arc */}
        {ratio > 0.005 && (
          <path
            d={describeArc(startAngle, valueAngle)}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
          />
        )}
        {/* Needle dot */}
        <circle cx={valuePoint.x} cy={valuePoint.y} r="5" fill={color} />
        {/* Center value */}
        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          className="fill-gray-900 dark:fill-gray-100"
          fontSize="22"
          fontWeight="bold"
        >
          {currentValue.toFixed(1)}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-gray-400 dark:fill-gray-500"
          fontSize="10"
        >
          {config.unit ?? ""}
        </text>
        {/* Min/Max labels */}
        <text
          x={arcStart.x - 2}
          y={arcStart.y + 14}
          textAnchor="middle"
          className="fill-gray-400 dark:fill-gray-500"
          fontSize="9"
        >
          {min}
        </text>
        <text
          x={arcEnd.x + 2}
          y={arcEnd.y + 14}
          textAnchor="middle"
          className="fill-gray-400 dark:fill-gray-500"
          fontSize="9"
        >
          {max}
        </text>
      </svg>
    </div>
  );
}
