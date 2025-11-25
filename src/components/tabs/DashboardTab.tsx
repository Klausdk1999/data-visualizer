"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cpu, Gauge } from "lucide-react";
import { getSignals, getSignalValues } from "@/lib/requestHandlers";
import type { Device, Signal, SignalValue } from "@/types";

interface DashboardTabProps {
  devices: Device[];
  signals: Signal[];
}

export default function DashboardTab({ devices, signals }: DashboardTabProps) {
  const [dashboardDevice, setDashboardDevice] = useState<number | null>(null);
  const [latestSignalValues, setLatestSignalValues] = useState<Map<number, SignalValue>>(new Map());

  useEffect(() => {
    if (dashboardDevice) {
      fetchLatestSignalValues(dashboardDevice);
    }
  }, [dashboardDevice]);

  const fetchLatestSignalValues = async (deviceId: number) => {
    try {
      const deviceSignals = await getSignals({ device_id: deviceId.toString() });
      const latestValues = new Map<number, SignalValue>();

      for (const signal of deviceSignals) {
        const values = await getSignalValues({
          signal_id: signal.id.toString(),
          limit: "1",
        });
        if (values.length > 0) {
          latestValues.set(signal.id, values[0]);
        }
      }

      setLatestSignalValues(latestValues);
    } catch (error) {
      console.error("Error fetching latest signal values:", error);
    }
  };

  const deviceSignals = signals.filter((s) => s.device_id === dashboardDevice);

  return (
    <Card className="bg-gray-700 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Device Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="dashboard-device"
              className="text-white mb-2 block flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              Select Device
            </Label>
            <select
              id="dashboard-device"
              value={dashboardDevice || ""}
              onChange={(e) => setDashboardDevice(e.target.value ? Number(e.target.value) : null)}
              className="w-full h-10 rounded-md border border-gray-600 bg-gray-800 text-white px-3"
            >
              <option value="">-- Select a device --</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.device_type || "N/A"})
                </option>
              ))}
            </select>
          </div>

          {dashboardDevice && (
            <div className="mt-6">
              <h3 className="text-white text-lg font-semibold mb-4">Latest Signal Values</h3>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-white">Signal Name</TableHead>
                    <TableHead className="text-white">Type</TableHead>
                    <TableHead className="text-white">Unit</TableHead>
                    <TableHead className="text-white">Latest Value</TableHead>
                    <TableHead className="text-white">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deviceSignals.map((signal) => {
                    const latestValue = latestSignalValues.get(signal.id);
                    return (
                      <TableRow key={signal.id} className="border-gray-600 hover:bg-gray-600">
                        <TableCell className="text-white">{signal.name}</TableCell>
                        <TableCell className="text-white">{signal.signal_type}</TableCell>
                        <TableCell className="text-white">{signal.unit || "-"}</TableCell>
                        <TableCell className="text-white">
                          {latestValue
                            ? latestValue.value !== null && latestValue.value !== undefined
                              ? `${latestValue.value}${signal.unit ? ` ${signal.unit}` : ""}`
                              : latestValue.digital_value !== null &&
                                  latestValue.digital_value !== undefined
                                ? latestValue.digital_value.toString()
                                : "N/A"
                            : "No data"}
                        </TableCell>
                        <TableCell className="text-white">
                          {latestValue ? new Date(latestValue.timestamp).toLocaleString() : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {deviceSignals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-white text-center">
                        No signals configured for this device
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
