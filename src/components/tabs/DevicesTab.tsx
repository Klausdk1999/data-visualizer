"use client";

import React from "react";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import type { Device } from "@/types";

interface DevicesTabProps {
  devices: Device[];
  selectedDevice: number | null;
  onDeviceSelect: (deviceId: number) => void;
  onAddDevice: () => void;
  onEditDevice: (device: Device) => void;
  onDeleteDevice: (deviceId: number) => void;
}

export default function DevicesTab({
  devices,
  selectedDevice,
  onDeviceSelect,
  onAddDevice,
  onEditDevice,
  onDeleteDevice,
}: DevicesTabProps) {
  return (
    <Card className="bg-gray-700 border-gray-600">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Devices</CardTitle>
        <Button onClick={onAddDevice} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
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
                  onClick={() => onDeviceSelect(device.id)}
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
                      onClick={() => onEditDevice(device)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteDevice(device.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
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
  );
}
