"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ALL_TIMESPANS, TIMESPAN_LABELS } from "./useWidgetData";
import type { Timespan } from "@/types/widgets";

interface TimespanSelectorProps {
  value: Timespan;
  onChange: (ts: Timespan) => void;
}

export function TimespanSelector({ value, onChange }: TimespanSelectorProps) {
  return (
    <div className="flex gap-1">
      {ALL_TIMESPANS.map((ts) => (
        <Button
          key={ts}
          variant={value === ts ? "default" : "ghost"}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => onChange(ts)}
        >
          {TIMESPAN_LABELS[ts]}
        </Button>
      ))}
    </div>
  );
}
