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
import type { Signal } from "@/types";

interface SignalsTabProps {
  signals: Signal[];
  selectedDevice: number | null;
  selectedSignal: number | null;
  onSignalSelect: (signalId: number) => void;
  onAddSignal: () => void;
  onEditSignal: (signal: Signal) => void;
  onDeleteSignal: (signalId: number) => void;
}

export default function SignalsTab({
  signals,
  selectedDevice,
  selectedSignal,
  onSignalSelect,
  onAddSignal,
  onEditSignal,
  onDeleteSignal,
}: SignalsTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-900 dark:text-white">
          Signal Configurations
          {selectedDevice && ` (Device ${selectedDevice})`}
        </CardTitle>
        <Button
          onClick={onAddSignal}
          disabled={!selectedDevice}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Signal
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Sensor</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signals.map((signal) => (
              <TableRow
                key={signal.id}
                className={selectedSignal === signal.id ? "bg-blue-100/50 dark:bg-blue-900/30" : ""}
              >
                <TableCell className="text-gray-900 dark:text-gray-100">{signal.id}</TableCell>
                <TableCell
                  className="text-gray-900 dark:text-gray-100 cursor-pointer"
                  onClick={() => onSignalSelect(signal.id)}
                >
                  {signal.name}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{signal.signal_type}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{signal.direction}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">{signal.sensor_name || "-"}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {signal.device?.name || signal.device_id}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {signal.is_active ? "Active" : "Inactive"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditSignal(signal)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteSignal(signal.id)}
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
