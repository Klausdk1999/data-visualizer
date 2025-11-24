"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { isAuthenticated, getCurrentUser, logout } from "@/lib/requestHandlers";
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
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
import type { Device, CreateDeviceRequest } from "@/types";
import Login from "@/components/Login";

export default function DevicesPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Device | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const auth = isAuthenticated();
    setAuthenticated(auth);
    if (auth) {
      fetchDevices();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const devicesData = await getDevices();
      setDevices(devicesData);
    } catch (error) {
      console.error("Error fetching devices:", error);
      setError("Failed to fetch devices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      fetchDevices();
    } catch (err: any) {
      setError(err.response?.data || "Failed to save device");
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    if (!confirm("Are you sure you want to delete this device?")) return;
    try {
      await deleteDevice(deviceId.toString());
      fetchDevices();
    } catch (err: any) {
      setError(err.response?.data || "Failed to delete device");
    }
  };

  const handleLoginSuccess = () => {
    setAuthenticated(true);
    fetchDevices();
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
              <h1 className="text-xl font-semibold">Devices</h1>
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
            <CardTitle className="text-white">All Devices</CardTitle>
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
                  <TableRow key={device.id} className="border-gray-600 hover:bg-gray-600">
                    <TableCell className="text-white">{device.id}</TableCell>
                    <TableCell className="text-white">
                      <button
                        onClick={() => router.push(`/devices/${device.id}`)}
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {device.name}
                      </button>
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
    </div>
  );
}

