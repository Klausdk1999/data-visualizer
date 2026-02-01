"use client";

import React from "react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  const setLast24Hours = () => {
    const end = new Date();
    const start = new Date();
    start.setHours(start.getHours() - 24);
    onStartDateChange(start.toISOString().split("T")[0]);
    onEndDateChange(end.toISOString().split("T")[0]);
  };

  const setLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    onStartDateChange(start.toISOString().split("T")[0]);
    onEndDateChange(end.toISOString().split("T")[0]);
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</label>
      <div className="flex gap-2">
        <button
          onClick={setLast24Hours}
          className="px-3 py-1 text-sm rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Last 24h
        </button>
        <button
          onClick={setLast7Days}
          className="px-3 py-1 text-sm rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Last 7d
        </button>
      </div>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />
      <span className="text-gray-600 dark:text-gray-400">to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />
    </div>
  );
}
