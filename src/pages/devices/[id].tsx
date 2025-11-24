"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { isAuthenticated, getCurrentUser, logout } from "@/lib/requestHandlers";
import {
  getDevice,
  getSignalsByDevice,
  getSignalValuesBySignal,
} from "@/lib/requestHandlers";
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
import type { Device, Signal, SignalValue } from "@/types";
import Login from "@/components/Login";

interface SignalWithLatestValue extends Signal {
  latestValue?: SignalValue;
}

export default function DeviceDashboard() {
  const router = useRouter();
  const { id } = router.query;
  const deviceId = typeof id === "string" ? id : null;
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<Device | null>(null);
  const [signals, setSignals] = useState<SignalWithLatestValue[]>([]);
  const [error, setError] = useState<string>("");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const auth = isAuthenticated();
    setAuthenticated(auth);
    if (auth && deviceId) {
      fetchDeviceData(deviceId);
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchDeviceData(deviceId);
      }, 30000);
      setRefreshInterval(interval);
    } else {
      setLoading(false);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [router.isReady, deviceId]);

  const fetchDeviceData = async (id?: string) => {
    const targetId = id || deviceId;
    if (!targetId) return;

    try {
      setLoading(true);
      const [deviceData, signalsData] = await Promise.all([
        getDevice(targetId),
        getSignalsByDevice(targetId),
      ]);
      setDevice(deviceData);

      // Fetch latest value for each signal
      const signalsWithValues = await Promise.all(
        signalsData.map(async (signal) => {
          try {
            const values = await getSignalValuesBySignal(signal.id.toString(), { limit: "1" });
            return {
              ...signal,
              latestValue: values.length > 0 ? values[0] : undefined,
            };
          } catch (error) {
            console.error(`Error fetching values for signal ${signal.id}:`, error);
            return {
              ...signal,
              latestValue: undefined,
            };
          }
        })
      );

      setSignals(signalsWithValues);
    } catch (error) {
      console.error("Error fetching device data:", error);
      setError("Failed to fetch device data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setAuthenticated(true);
    if (deviceId) {
      fetchDeviceData(deviceId);
    }
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      full: date.toLocaleString(),
    };
  };

  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div>Loading...</div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-6">
              <p className="text-white">Device not found</p>
              <Button onClick={() => router.push("/devices")} className="mt-4">
                Back to Devices
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <div className="w-full bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/devices")}>
                ← Back to Devices
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{device.name}</h1>
                <p className="text-sm text-gray-400">
                  {device.device_type && `${device.device_type}`}
                  {device.location && ` • ${device.location}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={fetchDeviceData}>
                Refresh
              </Button>
              <span className="text-sm">{getCurrentUser()?.email || getCurrentUser()?.name}</span>
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-600 text-white p-3 rounded-md">{error}</div>
        </div>
      )}

      {/* Device Info Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-gray-700 border-gray-600 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Device Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
              <div>
                <p className="text-sm text-gray-400">ID</p>
                <p className="font-semibold">{device.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Type</p>
                <p className="font-semibold">{device.device_type || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="font-semibold">{device.location || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className={`font-semibold ${device.is_active ? "text-green-400" : "text-red-400"}`}>
                  {device.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
            {device.description && (
              <div className="mt-4">
                <p className="text-sm text-gray-400">Description</p>
                <p className="text-white">{device.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signals with Latest Values */}
        <Card className="bg-gray-700 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">
              Signals ({signals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {signals.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No signals configured for this device
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-white">Signal ID</TableHead>
                    <TableHead className="text-white">Name</TableHead>
                    <TableHead className="text-white">Type</TableHead>
                    <TableHead className="text-white">Direction</TableHead>
                    <TableHead className="text-white">Unit</TableHead>
                    <TableHead className="text-white">Latest Value</TableHead>
                    <TableHead className="text-white">Value Type</TableHead>
                    <TableHead className="text-white">Last Updated</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signals.map((signal) => {
                    const latestValue = signal.latestValue;
                    const dateInfo = latestValue ? formatDate(latestValue.timestamp) : null;

                    return (
                      <TableRow key={signal.id} className="border-gray-600 hover:bg-gray-600">
                        <TableCell className="text-white">{signal.id}</TableCell>
                        <TableCell className="text-white">
                          <span className="text-white font-medium">
                            {signal.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-white">
                          <span className={`px-2 py-1 rounded text-xs ${
                            signal.signal_type === "analogic" 
                              ? "bg-blue-600 text-white" 
                              : "bg-purple-600 text-white"
                          }`}>
                            {signal.signal_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-white">
                          <span className={`px-2 py-1 rounded text-xs ${
                            signal.direction === "input" 
                              ? "bg-green-600 text-white" 
                              : "bg-orange-600 text-white"
                          }`}>
                            {signal.direction}
                          </span>
                        </TableCell>
                        <TableCell className="text-white">{signal.unit || "-"}</TableCell>
                        <TableCell className="text-white">
                          {latestValue ? (
                            <span className="font-semibold text-lg">
                              {signal.signal_type === "analogic" 
                                ? latestValue.value !== null && latestValue.value !== undefined
                                  ? `${latestValue.value}${signal.unit ? ` ${signal.unit}` : ""}`
                                  : "-"
                                : latestValue.digital_value !== null && latestValue.digital_value !== undefined
                                  ? latestValue.digital_value.toString()
                                  : "-"}
                            </span>
                          ) : (
                            <span className="text-gray-500">No data</span>
                          )}
                        </TableCell>
                        <TableCell className="text-white">
                          {latestValue ? (
                            signal.signal_type === "analogic" ? "Analog" : "Digital"
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-white">
                          {dateInfo ? dateInfo.time : "-"}
                        </TableCell>
                        <TableCell className="text-white">
                          {dateInfo ? dateInfo.date : "-"}
                        </TableCell>
                        <TableCell className="text-white">
                          <span className={`px-2 py-1 rounded text-xs ${
                            signal.is_active 
                              ? "bg-green-600 text-white" 
                              : "bg-red-600 text-white"
                          }`}>
                            {signal.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

