"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { isAuthenticated, getCurrentUser, logout } from "@/lib/requestHandlers";
import {
  getSignals,
  createSignal,
  updateSignal,
  deleteSignal,
  getDevices,
} from "@/lib/requestHandlers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Signal, CreateSignalRequest, Device } from "@/types";
import Login from "@/components/Login";

export default function SignalsPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [signalDialogOpen, setSignalDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Signal | null>(null);
  const [error, setError] = useState<string>("");
  const [filterDeviceId, setFilterDeviceId] = useState<string>("");

  useEffect(() => {
    const auth = isAuthenticated();
    setAuthenticated(auth);
    if (auth) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [signalsData, devicesData] = await Promise.all([
        getSignals(filterDeviceId ? { device_id: filterDeviceId } : undefined),
        getDevices(),
      ]);
      setSignals(signalsData);
      setDevices(devicesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch signals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [filterDeviceId]);

  const handleCreateSignal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const signalData: CreateSignalRequest = {
      device_id: parseInt(formData.get("device_id") as string),
      name: formData.get("name") as string,
      signal_type: formData.get("signal_type") as "digital" | "analogic",
      direction: formData.get("direction") as "input" | "output",
      sensor_name: (formData.get("sensor_name") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      unit: (formData.get("unit") as string) || undefined,
      min_value: formData.get("min_value")
        ? parseFloat(formData.get("min_value") as string)
        : undefined,
      max_value: formData.get("max_value")
        ? parseFloat(formData.get("max_value") as string)
        : undefined,
      is_active: formData.get("is_active") === "true",
    };

    try {
      if (editingItem) {
        await updateSignal(editingItem.id.toString(), signalData);
      } else {
        await createSignal(signalData);
      }
      setSignalDialogOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || "Failed to save signal");
    }
  };

  const handleDeleteSignal = async (signalId: number) => {
    if (!confirm("Are you sure you want to delete this signal?")) return;
    try {
      await deleteSignal(signalId.toString());
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || "Failed to delete signal");
    }
  };

  const handleLoginSuccess = () => {
    setAuthenticated(true);
    fetchData();
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
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

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <div className="w-full bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/")}>
                ← Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold">Signal Configurations</h1>
            </div>
            <div className="flex items-center space-x-4">
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-gray-700 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">All Signals</CardTitle>
            <div className="flex items-center space-x-4">
              <select
                value={filterDeviceId}
                onChange={(e) => setFilterDeviceId(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900"
              >
                <option value="">All Devices</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id.toString()}>
                    {device.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setSignalDialogOpen(true);
                }}
              >
                Add Signal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-white">ID</TableHead>
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Type</TableHead>
                  <TableHead className="text-white">Direction</TableHead>
                  <TableHead className="text-white">Sensor</TableHead>
                  <TableHead className="text-white">Device</TableHead>
                  <TableHead className="text-white">Unit</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signals.map((signal) => (
                  <TableRow key={signal.id} className="border-gray-600 hover:bg-gray-600">
                    <TableCell className="text-white">{signal.id}</TableCell>
                    <TableCell className="text-white">{signal.name}</TableCell>
                    <TableCell className="text-white">{signal.signal_type}</TableCell>
                    <TableCell className="text-white">{signal.direction}</TableCell>
                    <TableCell className="text-white">{signal.sensor_name || "-"}</TableCell>
                    <TableCell className="text-white">
                      <button
                        onClick={() => router.push(`/devices/${signal.device_id}`)}
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {signal.device?.name || signal.device_id}
                      </button>
                    </TableCell>
                    <TableCell className="text-white">{signal.unit || "-"}</TableCell>
                    <TableCell className="text-white">
                      {signal.is_active ? "Active" : "Inactive"}
                    </TableCell>
                    <TableCell className="text-white">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingItem(signal);
                            setSignalDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSignal(signal.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Signal Dialog */}
      <Dialog open={signalDialogOpen} onOpenChange={setSignalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Signal" : "Create Signal"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSignal}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="signal-device-id">Device *</Label>
                <select
                  id="signal-device-id"
                  name="device_id"
                  required
                  defaultValue={editingItem?.device_id}
                  className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="">Select Device</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="signal-name">Name *</Label>
                <Input
                  id="signal-name"
                  name="name"
                  required
                  defaultValue={editingItem?.name}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="signal-type">Signal Type *</Label>
                <select
                  id="signal-type"
                  name="signal_type"
                  required
                  defaultValue={editingItem?.signal_type || "analogic"}
                  className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="analogic">Analogic</option>
                  <option value="digital">Digital</option>
                </select>
              </div>
              <div>
                <Label htmlFor="signal-direction">Direction *</Label>
                <select
                  id="signal-direction"
                  name="direction"
                  required
                  defaultValue={editingItem?.direction || "input"}
                  className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="input">Input</option>
                  <option value="output">Output</option>
                </select>
              </div>
              <div>
                <Label htmlFor="signal-sensor-name">Sensor Name</Label>
                <Input
                  id="signal-sensor-name"
                  name="sensor_name"
                  defaultValue={editingItem?.sensor_name}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="signal-unit">Unit</Label>
                <Input
                  id="signal-unit"
                  name="unit"
                  defaultValue={editingItem?.unit}
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="signal-min-value">Min Value</Label>
                  <Input
                    id="signal-min-value"
                    name="min_value"
                    type="number"
                    step="any"
                    defaultValue={editingItem?.min_value}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="signal-max-value">Max Value</Label>
                  <Input
                    id="signal-max-value"
                    name="max_value"
                    type="number"
                    step="any"
                    defaultValue={editingItem?.max_value}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="signal-active">Active</Label>
                <select
                  id="signal-active"
                  name="is_active"
                  defaultValue={editingItem?.is_active !== false ? "true" : "false"}
                  className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSignalDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
