"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/requestHandlers";
import {
  getDevices,
  getSignals,
  getSignalValues,
  createDevice,
  updateDevice,
  deleteDevice,
  createSignal,
  updateSignal,
  deleteSignal,
  createSignalValue,
  deleteSignalValue,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
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
import type {
  User,
  Device,
  Signal,
  SignalValue,
  CreateDeviceRequest,
  CreateSignalRequest,
  CreateSignalValueRequest,
  CreateUserRequest,
} from "@/types";

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalValues, setSignalValues] = useState<SignalValue[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"devices" | "signals" | "values" | "users">("devices");
  
  // Dialog states
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [signalDialogOpen, setSignalDialogOpen] = useState(false);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devicesData, signalsData, valuesData, usersData] = await Promise.all([
        getDevices(),
        getSignals(),
        getSignalValues({ limit: "100" }),
        getUsers(),
      ]);
      setDevices(devicesData);
      setSignals(signalsData);
      setSignalValues(valuesData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please try again.");
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

  // Device CRUD
  const handleCreateDevice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const deviceData: CreateDeviceRequest = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      device_type: formData.get("device_type") as string || undefined,
      location: formData.get("location") as string || undefined,
    };

    try {
      if (editingItem) {
        await updateDevice(editingItem.id.toString(), deviceData);
      } else {
        await createDevice(deviceData);
      }
      setDeviceDialogOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || "Failed to save device");
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    if (!confirm("Are you sure you want to delete this device?")) return;
    try {
      await deleteDevice(deviceId.toString());
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || "Failed to delete device");
    }
  };

  // Signal CRUD
  const handleCreateSignal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const signalData: CreateSignalRequest = {
      device_id: parseInt(formData.get("device_id") as string),
      name: formData.get("name") as string,
      signal_type: formData.get("signal_type") as "digital" | "analogic",
      direction: formData.get("direction") as "input" | "output",
      sensor_name: formData.get("sensor_name") as string || undefined,
      description: formData.get("description") as string || undefined,
      unit: formData.get("unit") as string || undefined,
      min_value: formData.get("min_value") ? parseFloat(formData.get("min_value") as string) : undefined,
      max_value: formData.get("max_value") ? parseFloat(formData.get("max_value") as string) : undefined,
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
      if (selectedDevice) fetchDeviceSignals(selectedDevice);
    } catch (err: any) {
      setError(err.response?.data || "Failed to save signal");
    }
  };

  const handleDeleteSignal = async (signalId: number) => {
    if (!confirm("Are you sure you want to delete this signal?")) return;
    try {
      await deleteSignal(signalId.toString());
      fetchData();
      if (selectedDevice) fetchDeviceSignals(selectedDevice);
    } catch (err: any) {
      setError(err.response?.data || "Failed to delete signal");
    }
  };

  // Signal Value CRUD
  const handleCreateSignalValue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const valueData: CreateSignalValueRequest = {
      signal_id: parseInt(formData.get("signal_id") as string),
      value: formData.get("value") ? parseFloat(formData.get("value") as string) : undefined,
      digital_value: formData.get("digital_value") === "true" ? true : formData.get("digital_value") === "false" ? false : undefined,
    };

    try {
      await createSignalValue(valueData);
      setValueDialogOpen(false);
      fetchData();
      if (selectedSignal) fetchSignalValues(selectedSignal);
    } catch (err: any) {
      setError(err.response?.data || "Failed to create signal value");
    }
  };

  const handleDeleteSignalValue = async (valueId: number) => {
    if (!confirm("Are you sure you want to delete this signal value?")) return;
    try {
      await deleteSignalValue(valueId.toString());
      fetchData();
      if (selectedSignal) fetchSignalValues(selectedSignal);
    } catch (err: any) {
      setError(err.response?.data || "Failed to delete signal value");
    }
  };

  // User CRUD
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const userData: CreateUserRequest = {
      name: formData.get("name") as string,
      email: formData.get("email") as string || undefined,
      password: formData.get("password") as string || undefined,
      categoria: formData.get("categoria") as string || undefined,
      matricula: formData.get("matricula") as string || undefined,
      rfid: formData.get("rfid") as string || undefined,
    };

    try {
      if (editingItem) {
        await updateUser(editingItem.id.toString(), userData);
      } else {
        await createUser(userData);
      }
      setUserDialogOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || "Failed to save user");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(userId.toString());
      fetchData();
    } catch (err: any) {
      setError(err.response?.data || "Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <div className="w-full bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">IoT Dashboard</h1>
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/devices"}>
                Devices
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/signals"}>
                Signals
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">{user?.email || user?.name}</span>
              <Button variant="destructive" size="sm" onClick={onLogout}>
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
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 ${
              activeTab === "users"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Users
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
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Devices</CardTitle>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setDeviceDialogOpen(true);
                    }}
                  >
                    Add Device
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-white">ID</TableHead>
                        <TableHead className="text-white">Name</TableHead>
                        <TableHead className="text-white">Type</TableHead>
                        <TableHead className="text-white">Location</TableHead>
                        <TableHead className="text-white">User</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devices.map((device) => (
                        <TableRow
                          key={device.id}
                          className={`border-gray-600 ${
                            selectedDevice === device.id ? "bg-blue-900" : "hover:bg-gray-600"
                          }`}
                        >
                          <TableCell className="text-white">{device.id}</TableCell>
                          <TableCell
                            className="text-white cursor-pointer"
                            onClick={() => handleDeviceSelect(device.id)}
                          >
                            {device.name}
                          </TableCell>
                          <TableCell className="text-white">{device.device_type || "-"}</TableCell>
                          <TableCell className="text-white">{device.location || "-"}</TableCell>
                          <TableCell className="text-white">
                            {device.user?.name || device.user_id || "-"}
                          </TableCell>
                          <TableCell className="text-white">
                            {device.is_active ? "Active" : "Inactive"}
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingItem(device);
                                  setDeviceDialogOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteDevice(device.id)}
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
            )}

            {activeTab === "signals" && (
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">
                    Signal Configurations
                    {selectedDevice && ` (Device ${selectedDevice})`}
                  </CardTitle>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setSignalDialogOpen(true);
                    }}
                    disabled={!selectedDevice}
                  >
                    Add Signal
                  </Button>
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
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signals.map((signal) => (
                        <TableRow
                          key={signal.id}
                          className={`border-gray-600 ${
                            selectedSignal === signal.id ? "bg-blue-900" : "hover:bg-gray-600"
                          }`}
                        >
                          <TableCell className="text-white">{signal.id}</TableCell>
                          <TableCell
                            className="text-white cursor-pointer"
                            onClick={() => handleSignalSelect(signal.id)}
                          >
                            {signal.name}
                          </TableCell>
                          <TableCell className="text-white">{signal.signal_type}</TableCell>
                          <TableCell className="text-white">{signal.direction}</TableCell>
                          <TableCell className="text-white">{signal.sensor_name || "-"}</TableCell>
                          <TableCell className="text-white">
                            {signal.device?.name || signal.device_id}
                          </TableCell>
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
            )}

            {activeTab === "values" && (
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">
                    Signal Values
                    {selectedSignal && ` (Signal ${selectedSignal})`}
                  </CardTitle>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setValueDialogOpen(true);
                    }}
                    disabled={!selectedSignal}
                  >
                    Add Value
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-white">ID</TableHead>
                        <TableHead className="text-white">Timestamp</TableHead>
                        <TableHead className="text-white">Signal</TableHead>
                        <TableHead className="text-white">Value</TableHead>
                        <TableHead className="text-white">Digital</TableHead>
                        <TableHead className="text-white">User</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signalValues.map((value) => (
                        <TableRow key={value.id} className="border-gray-600 hover:bg-gray-600">
                          <TableCell className="text-white">{value.id}</TableCell>
                          <TableCell className="text-white">
                            {new Date(value.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-white">
                            {value.signal?.name || value.signal_id}
                          </TableCell>
                          <TableCell className="text-white">
                            {value.value !== null && value.value !== undefined ? value.value : "-"}
                          </TableCell>
                          <TableCell className="text-white">
                            {value.digital_value !== null && value.digital_value !== undefined
                              ? value.digital_value.toString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-white">
                            {value.user?.name || value.user_id || "-"}
                          </TableCell>
                          <TableCell className="text-white">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSignalValue(value.id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === "users" && (
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Users</CardTitle>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setUserDialogOpen(true);
                    }}
                  >
                    Add User
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-white">ID</TableHead>
                        <TableHead className="text-white">Name</TableHead>
                        <TableHead className="text-white">Email</TableHead>
                        <TableHead className="text-white">Categoria</TableHead>
                        <TableHead className="text-white">Matricula</TableHead>
                        <TableHead className="text-white">RFID</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id} className="border-gray-600 hover:bg-gray-600">
                          <TableCell className="text-white">{u.id}</TableCell>
                          <TableCell className="text-white">{u.name}</TableCell>
                          <TableCell className="text-white">{u.email || "-"}</TableCell>
                          <TableCell className="text-white">{u.categoria || "-"}</TableCell>
                          <TableCell className="text-white">{u.matricula || "-"}</TableCell>
                          <TableCell className="text-white">{u.rfid || "-"}</TableCell>
                          <TableCell className="text-white">
                            {u.is_active ? "Active" : "Inactive"}
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingItem(u);
                                  setUserDialogOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(u.id)}
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
            )}
          </>
        )}
      </div>

      {/* Device Dialog */}
      <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Device" : "Create Device"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateDevice}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="device-name">Name *</Label>
                <Input
                  id="device-name"
                  name="name"
                  required
                  defaultValue={editingItem?.name}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="device-description">Description</Label>
                <Input
                  id="device-description"
                  name="description"
                  defaultValue={editingItem?.description}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="device-type">Device Type</Label>
                <Input
                  id="device-type"
                  name="device_type"
                  defaultValue={editingItem?.device_type}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="device-location">Location</Label>
                <Input
                  id="device-location"
                  name="location"
                  defaultValue={editingItem?.location}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeviceDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signal Dialog */}
      <Dialog open={signalDialogOpen} onOpenChange={setSignalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Signal" : "Create Signal"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSignal}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="signal-device-id">Device ID *</Label>
                <Input
                  id="signal-device-id"
                  name="device_id"
                  type="number"
                  required
                  defaultValue={editingItem?.device_id || selectedDevice}
                  className="mt-1"
                />
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

      {/* Signal Value Dialog */}
      <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Signal Value</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSignalValue}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="value-signal-id">Signal ID *</Label>
                <Input
                  id="value-signal-id"
                  name="signal_id"
                  type="number"
                  required
                  defaultValue={selectedSignal || undefined}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="value-value">Value (for analogic)</Label>
                <Input
                  id="value-value"
                  name="value"
                  type="number"
                  step="any"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="value-digital">Digital Value (for digital)</Label>
                <select
                  id="value-digital"
                  name="digital_value"
                  className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="">None</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setValueDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit User" : "Create User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="user-name">Name *</Label>
                <Input
                  id="user-name"
                  name="name"
                  required
                  defaultValue={editingItem?.name}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  name="email"
                  type="email"
                  defaultValue={editingItem?.email}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="user-password">Password{!editingItem && " *"}</Label>
                <Input
                  id="user-password"
                  name="password"
                  type="password"
                  required={!editingItem}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="user-categoria">Categoria</Label>
                <Input
                  id="user-categoria"
                  name="categoria"
                  defaultValue={editingItem?.categoria}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="user-matricula">Matricula</Label>
                <Input
                  id="user-matricula"
                  name="matricula"
                  defaultValue={editingItem?.matricula}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="user-rfid">RFID</Label>
                <Input
                  id="user-rfid"
                  name="rfid"
                  defaultValue={editingItem?.rfid}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>
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

