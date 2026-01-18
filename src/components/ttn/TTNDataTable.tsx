"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TTNUplink } from "@/types/ttn";

interface TTNDataTableProps {
  data: TTNUplink[];
  loading?: boolean;
}

export default function TTNDataTable({ data, loading }: TTNDataTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        Loading data...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Device ID</TableHead>
            <TableHead>Distance (cm)</TableHead>
            <TableHead>Battery (%)</TableHead>
            <TableHead>Temperature (°C)</TableHead>
            <TableHead>Signal Strength</TableHead>
            <TableHead>RSSI</TableHead>
            <TableHead>SNR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((uplink) => (
            <TableRow key={uplink.id}>
              <TableCell>{new Date(uplink.received_at).toLocaleString()}</TableCell>
              <TableCell className="font-mono text-sm">{uplink.device_id}</TableCell>
              <TableCell>{uplink.distance_cm.toFixed(2)}</TableCell>
              <TableCell>{uplink.battery_percent}</TableCell>
              <TableCell>{uplink.temperature}</TableCell>
              <TableCell>{uplink.signal_strength}</TableCell>
              <TableCell>{uplink.rssi} dBm</TableCell>
              <TableCell>{uplink.snr.toFixed(1)} dB</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
