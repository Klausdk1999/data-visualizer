"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save } from "lucide-react";
import type { Signal, CreateSignalRequest } from "@/types";

interface SignalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: Signal | null;
  selectedDevice: number | null;
  onSubmit: (data: CreateSignalRequest) => void;
}

export default function SignalDialog({
  open,
  onOpenChange,
  editingItem,
  selectedDevice,
  onSubmit,
}: SignalDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const signalData: CreateSignalRequest = {
      device_id: Number(formData.get("device_id")),
      name: formData.get("name") as string,
      signal_type: formData.get("signal_type") as "analogic" | "digital",
      direction: formData.get("direction") as "input" | "output",
      sensor_name: (formData.get("sensor_name") as string) || undefined,
      unit: (formData.get("unit") as string) || undefined,
      min_value: formData.get("min_value") ? Number(formData.get("min_value")) : undefined,
      max_value: formData.get("max_value") ? Number(formData.get("max_value")) : undefined,
      is_active: formData.get("is_active") === "true",
    };
    onSubmit(signalData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {editingItem ? "Edit Signal" : "Create Signal"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="signal-device-id" className="text-gray-900">
                Device ID *
              </Label>
              <Input
                id="signal-device-id"
                name="device_id"
                type="number"
                required
                defaultValue={editingItem?.device_id || selectedDevice || ""}
                className="mt-1 bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="signal-name" className="text-gray-900">
                Name *
              </Label>
              <Input
                id="signal-name"
                name="name"
                required
                defaultValue={editingItem?.name}
                className="mt-1 bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="signal-type" className="text-gray-900">
                Signal Type *
              </Label>
              <select
                id="signal-type"
                name="signal_type"
                required
                defaultValue={editingItem?.signal_type || "analogic"}
                className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white text-gray-900"
              >
                <option value="analogic">Analogic</option>
                <option value="digital">Digital</option>
              </select>
            </div>
            <div>
              <Label htmlFor="signal-direction" className="text-gray-900">
                Direction *
              </Label>
              <select
                id="signal-direction"
                name="direction"
                required
                defaultValue={editingItem?.direction || "input"}
                className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white text-gray-900"
              >
                <option value="input">Input</option>
                <option value="output">Output</option>
              </select>
            </div>
            <div>
              <Label htmlFor="signal-sensor-name" className="text-gray-900">
                Sensor Name
              </Label>
              <Input
                id="signal-sensor-name"
                name="sensor_name"
                defaultValue={editingItem?.sensor_name}
                className="mt-1 bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="signal-unit" className="text-gray-900">
                Unit
              </Label>
              <Input
                id="signal-unit"
                name="unit"
                defaultValue={editingItem?.unit}
                className="mt-1 bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="signal-min-value" className="text-gray-900">
                  Min Value
                </Label>
                <Input
                  id="signal-min-value"
                  name="min_value"
                  type="number"
                  step="any"
                  defaultValue={editingItem?.min_value}
                  className="mt-1 bg-white text-gray-900 border-gray-300"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="signal-max-value" className="text-gray-900">
                  Max Value
                </Label>
                <Input
                  id="signal-max-value"
                  name="max_value"
                  type="number"
                  step="any"
                  defaultValue={editingItem?.max_value}
                  className="mt-1 bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="signal-active" className="text-gray-900">
                Active
              </Label>
              <select
                id="signal-active"
                name="is_active"
                defaultValue={editingItem?.is_active !== false ? "true" : "false"}
                className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white text-gray-900"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
