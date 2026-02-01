"use client";

import React from "react";
import type { TTNParameter } from "@/types/ttn";

interface ParameterSelectorProps {
  value: TTNParameter;
  onChange: (parameter: TTNParameter) => void;
}

export default function ParameterSelector({ value, onChange }: ParameterSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Parameter:</label>
      <div className="flex gap-2">
        <button
          onClick={() => onChange("distance")}
          className={`px-4 py-2 rounded-lg transition-all ${
            value === "distance"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Distance (cm)
        </button>
        <button
          onClick={() => onChange("battery")}
          className={`px-4 py-2 rounded-lg transition-all ${
            value === "battery"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Battery (%)
        </button>
      </div>
    </div>
  );
}
