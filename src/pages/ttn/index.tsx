"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TTNChart from "@/components/ttn/TTNChart";
import TTNDataTable from "@/components/ttn/TTNDataTable";
import DateRangePicker from "@/components/ttn/DateRangePicker";
import ParameterSelector from "@/components/ttn/ParameterSelector";
import { getTTNUplinks, getTTNStats } from "@/lib/requestHandlers";
import type { TTNUplink, TTNParameter, TTNStats } from "@/types/ttn";

export default function TTNDashboard() {
  const [uplinks, setUplinks] = useState<TTNUplink[]>([]);
  const [stats, setStats] = useState<TTNStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range state (default: last 24 hours)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() - 24);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Parameter selection
  const [parameter, setParameter] = useState<TTNParameter>("distance");

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Convert dates to ISO format for API
      const startISO = new Date(startDate).toISOString();
      const endISO = new Date(endDate + "T23:59:59").toISOString();

      const [uplinksData, statsData] = await Promise.all([
        getTTNUplinks({
          start_date: startISO,
          end_date: endISO,
          limit: 1000,
        }),
        getTTNStats(),
      ]);

      setUplinks(uplinksData);
      setStats(statsData);
    } catch (err: any) {
      console.error("Error fetching TTN data:", err);
      setError(err.response?.data?.error || "Failed to fetch TTN data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          TTN River Monitoring Dashboard
        </h1>
        {stats && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Uplinks: {stats.total_uplinks} | Devices: {stats.unique_devices}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <ParameterSelector value={parameter} onChange={setParameter} />
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            {parameter === "distance" ? "Distance Over Time" : "Battery Level Over Time"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
              Loading chart data...
            </div>
          ) : (
            <TTNChart data={uplinks} parameter={parameter} />
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Uplink Data</CardTitle>
        </CardHeader>
        <CardContent>
          <TTNDataTable data={uplinks} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
