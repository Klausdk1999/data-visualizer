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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-900 dark:text-white">Devices</CardTitle>
        <Button onClick={onAddDevice} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Device
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow
                key={device.id}
                className={selectedDevice === device.id ? "bg-blue-100/50 dark:bg-blue-900/30" : ""}
              >
                <TableCell className="text-gray-900 dark:text-gray-100">{device.id}</TableCell>
                <TableCell
                  className="text-gray-900 dark:text-gray-100 cursor-pointer"
                  onClick={() => onDeviceSelect(device.id)}
                >
                  {device.name}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {device.device_type || "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {device.location || "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {device.user?.name || device.user_id || "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {device.is_active ? "Active" : "Inactive"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
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
