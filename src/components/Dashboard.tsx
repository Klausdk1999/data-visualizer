"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/requestHandlers";
import {
  getDevices,
  getSignals,
  getSignalValues,
  createDevice,
  createSignal,
  createSignalValue,
} from "@/lib/requestHandlers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [signalValues, setSignalValues] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"devices" | "signals" | "values">("devices");

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devicesData, signalsData, valuesData] = await Promise.all([
        getDevices(),
        getSignals(),
        getSignalValues({ limit: "100" }),
      ]);
      setDevices(devicesData);
      setSignals(signalsData);
      setSignalValues(valuesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceSelect = (deviceId: number) => {
    setSelectedDevice(deviceId === selectedDevice ? null : deviceId);
    if (deviceId !== selectedDevice) {
      fetchDeviceSignals(deviceId);
    }
  };

  const fetchDeviceSignals = async (deviceId: number) => {
    try {
      const deviceSignals = await getSignals({ device_id: deviceId.toString() });
      setSignals(deviceSignals);
      setSelectedSignal(null);
    } catch (error) {
      console.error("Error fetching device signals:", error);
    }
  };

  const handleSignalSelect = (signalId: number) => {
    setSelectedSignal(signalId === selectedSignal ? null : signalId);
    if (signalId !== selectedSignal) {
      fetchSignalValues(signalId);
    }
  };

  const fetchSignalValues = async (signalId: number) => {
    try {
      const values = await getSignalValues({ signal_id: signalId.toString(), limit: "100" });
      setSignalValues(values);
    } catch (error) {
      console.error("Error fetching signal values:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <div className="w-full bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">IoT Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">{user?.email || user?.name}</span>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex space-x-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("devices")}
            className={`px-4 py-2 ${
              activeTab === "devices"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Devices
          </button>
          <button
            onClick={() => setActiveTab("signals")}
            className={`px-4 py-2 ${
              activeTab === "signals"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Signal Configurations
          </button>
          <button
            onClick={() => setActiveTab("values")}
            className={`px-4 py-2 ${
              activeTab === "values"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Signal Values
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-white text-center">Loading...</div>
        ) : (
          <>
            {activeTab === "devices" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-white">Devices</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white">ID</TableHead>
                        <TableHead className="text-white">Name</TableHead>
                        <TableHead className="text-white">Type</TableHead>
                        <TableHead className="text-white">Location</TableHead>
                        <TableHead className="text-white">User</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devices.map((device) => (
                        <TableRow
                          key={device.id}
                          className={`cursor-pointer ${
                            selectedDevice === device.id ? "bg-blue-900" : "hover:bg-gray-700"
                          }`}
                          onClick={() => handleDeviceSelect(device.id)}
                        >
                          <TableCell className="text-white">{device.id}</TableCell>
                          <TableCell className="text-white">{device.name}</TableCell>
                          <TableCell className="text-white">{device.device_type || "-"}</TableCell>
                          <TableCell className="text-white">{device.location || "-"}</TableCell>
                          <TableCell className="text-white">
                            {device.user?.name || device.user_id || "-"}
                          </TableCell>
                          <TableCell className="text-white">
                            {device.is_active ? "Active" : "Inactive"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === "signals" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-white">
                    Signal Configurations
                    {selectedDevice && ` (Device ${selectedDevice})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white">ID</TableHead>
                        <TableHead className="text-white">Name</TableHead>
                        <TableHead className="text-white">Type</TableHead>
                        <TableHead className="text-white">Direction</TableHead>
                        <TableHead className="text-white">Sensor</TableHead>
                        <TableHead className="text-white">Device</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signals.map((signal) => (
                        <TableRow
                          key={signal.id}
                          className={`cursor-pointer ${
                            selectedSignal === signal.id ? "bg-blue-900" : "hover:bg-gray-700"
                          }`}
                          onClick={() => handleSignalSelect(signal.id)}
                        >
                          <TableCell className="text-white">{signal.id}</TableCell>
                          <TableCell className="text-white">{signal.name}</TableCell>
                          <TableCell className="text-white">{signal.signal_type}</TableCell>
                          <TableCell className="text-white">{signal.direction}</TableCell>
                          <TableCell className="text-white">{signal.sensor_name || "-"}</TableCell>
                          <TableCell className="text-white">
                            {signal.device?.name || signal.device_id}
                          </TableCell>
                          <TableCell className="text-white">
                            {signal.is_active ? "Active" : "Inactive"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === "values" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-white">
                    Signal Values
                    {selectedSignal && ` (Signal ${selectedSignal})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white">ID</TableHead>
                        <TableHead className="text-white">Timestamp</TableHead>
                        <TableHead className="text-white">Signal</TableHead>
                        <TableHead className="text-white">Value</TableHead>
                        <TableHead className="text-white">Digital</TableHead>
                        <TableHead className="text-white">User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signalValues.map((value) => (
                        <TableRow key={value.id} className="hover:bg-gray-700">
                          <TableCell className="text-white">{value.id}</TableCell>
                          <TableCell className="text-white">
                            {new Date(value.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-white">
                            {value.signal?.name || value.signal_id}
                          </TableCell>
                          <TableCell className="text-white">
                            {value.value !== null && value.value !== undefined
                              ? value.value
                              : "-"}
                          </TableCell>
                          <TableCell className="text-white">
                            {value.digital_value !== null && value.digital_value !== undefined
                              ? value.digital_value.toString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-white">
                            {value.user?.name || value.user_id || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

