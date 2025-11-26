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
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Cpu, Radio, Activity, Users, LogOut } from "lucide-react";
import DashboardTab from "@/components/tabs/DashboardTab";
import DevicesTab from "@/components/tabs/DevicesTab";
import SignalsTab from "@/components/tabs/SignalsTab";
import SignalValuesTab from "@/components/tabs/SignalValuesTab";
import UsersTab from "@/components/tabs/UsersTab";
import DeviceDialog from "@/components/dialogs/DeviceDialog";
import SignalDialog from "@/components/dialogs/SignalDialog";
import SignalValueDialog from "@/components/dialogs/SignalValueDialog";
import UserDialog from "@/components/dialogs/UserDialog";
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
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "devices" | "signals" | "values" | "users"
  >("dashboard");

  // Dialog states
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [signalDialogOpen, setSignalDialogOpen] = useState(false);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Device | Signal | User | null>(null);
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

  // Device CRUD handlers
  const handleCreateDevice = async (deviceData: CreateDeviceRequest) => {
    setError("");
    try {
      if (editingItem && "device_type" in editingItem) {
        await updateDevice((editingItem as Device).id.toString(), deviceData);
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

  // Signal CRUD handlers
  const handleCreateSignal = async (signalData: CreateSignalRequest) => {
    setError("");
    try {
      if (editingItem && "signal_type" in editingItem) {
        await updateSignal((editingItem as Signal).id.toString(), signalData);
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

  // Signal Value CRUD handlers
  const handleCreateSignalValue = async (valueData: CreateSignalValueRequest) => {
    setError("");
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

  // User CRUD handlers
  const handleCreateUser = async (userData: CreateUserRequest) => {
    setError("");
    try {
      if (editingItem && "email" in editingItem) {
        await updateUser((editingItem as User).id.toString(), userData);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="w-full bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm dark:bg-gray-800/70 dark:border-white/10 rounded-b-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <LayoutDashboard className="w-6 h-6" />
              IoT Data Storage Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">{user?.email || user?.name}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={onLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-500/90 backdrop-blur-sm text-white p-3 rounded-xl shadow-md border border-red-400/30">{error}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex space-x-2 bg-white/50 backdrop-blur-xl rounded-2xl p-1.5 border border-white/30 shadow-sm dark:bg-gray-800/50 dark:border-white/10">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-5 py-2.5 flex items-center gap-2 rounded-xl font-medium transition-all ${
              activeTab === "dashboard"
                ? "bg-blue-500/90 backdrop-blur-sm text-white shadow-lg ring-2 ring-blue-400/30 scale-105"
                : "text-gray-700 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-700/50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("devices")}
            className={`px-5 py-2.5 flex items-center gap-2 rounded-xl font-medium transition-all ${
              activeTab === "devices"
                ? "bg-blue-500/90 backdrop-blur-sm text-white shadow-lg ring-2 ring-blue-400/30 scale-105"
                : "text-gray-700 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-700/50"
            }`}
          >
            <Cpu className="w-4 h-4" />
            Devices
          </button>
          <button
            onClick={() => setActiveTab("signals")}
            className={`px-5 py-2.5 flex items-center gap-2 rounded-xl font-medium transition-all ${
              activeTab === "signals"
                ? "bg-blue-500/90 backdrop-blur-sm text-white shadow-lg ring-2 ring-blue-400/30 scale-105"
                : "text-gray-700 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-700/50"
            }`}
          >
            <Radio className="w-4 h-4" />
            Signal Configurations
          </button>
          <button
            onClick={() => setActiveTab("values")}
            className={`px-5 py-2.5 flex items-center gap-2 rounded-xl font-medium transition-all ${
              activeTab === "values"
                ? "bg-blue-500/90 backdrop-blur-sm text-white shadow-lg ring-2 ring-blue-400/30 scale-105"
                : "text-gray-700 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-700/50"
            }`}
          >
            <Activity className="w-4 h-4" />
            Signal Values
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-5 py-2.5 flex items-center gap-2 rounded-xl font-medium transition-all ${
              activeTab === "users"
                ? "bg-blue-500/90 backdrop-blur-sm text-white shadow-lg ring-2 ring-blue-400/30 scale-105"
                : "text-gray-700 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-700/50"
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-gray-700 dark:text-gray-300 text-center">Loading...</div>
        ) : (
          <>
            {activeTab === "dashboard" && <DashboardTab devices={devices} signals={signals} />}

            {activeTab === "devices" && (
              <DevicesTab
                devices={devices}
                selectedDevice={selectedDevice}
                onDeviceSelect={handleDeviceSelect}
                onAddDevice={() => {
                  setEditingItem(null);
                  setDeviceDialogOpen(true);
                }}
                onEditDevice={(device) => {
                  setEditingItem(device);
                  setDeviceDialogOpen(true);
                }}
                onDeleteDevice={handleDeleteDevice}
              />
            )}

            {activeTab === "signals" && (
              <SignalsTab
                signals={signals}
                selectedDevice={selectedDevice}
                selectedSignal={selectedSignal}
                onSignalSelect={handleSignalSelect}
                onAddSignal={() => {
                  setEditingItem(null);
                  setSignalDialogOpen(true);
                }}
                onEditSignal={(signal) => {
                  setEditingItem(signal);
                  setSignalDialogOpen(true);
                }}
                onDeleteSignal={handleDeleteSignal}
              />
            )}

            {activeTab === "values" && (
              <SignalValuesTab
                signals={signals}
                signalValues={signalValues}
                selectedSignal={selectedSignal}
                onAddValue={() => {
                  setEditingItem(null);
                  setValueDialogOpen(true);
                }}
                onDeleteValue={handleDeleteSignalValue}
              />
            )}

            {activeTab === "users" && (
              <UsersTab
                users={users}
                onAddUser={() => {
                  setEditingItem(null);
                  setUserDialogOpen(true);
                }}
                onEditUser={(user) => {
                  setEditingItem(user);
                  setUserDialogOpen(true);
                }}
                onDeleteUser={handleDeleteUser}
              />
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <DeviceDialog
        open={deviceDialogOpen}
        onOpenChange={setDeviceDialogOpen}
        editingItem={editingItem as Device | null}
        onSubmit={handleCreateDevice}
      />

      <SignalDialog
        open={signalDialogOpen}
        onOpenChange={setSignalDialogOpen}
        editingItem={editingItem as Signal | null}
        selectedDevice={selectedDevice}
        onSubmit={handleCreateSignal}
      />

      <SignalValueDialog
        open={valueDialogOpen}
        onOpenChange={setValueDialogOpen}
        selectedSignal={selectedSignal}
        onSubmit={handleCreateSignalValue}
      />

      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        editingItem={editingItem as User | null}
        onSubmit={handleCreateUser}
      />
    </div>
  );
}
