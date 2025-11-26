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
import type { Device, CreateDeviceRequest } from "@/types";

interface DeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: Device | null;
  onSubmit: (data: CreateDeviceRequest) => void;
}

export default function DeviceDialog({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
}: DeviceDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const deviceData: CreateDeviceRequest = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      device_type: (formData.get("device_type") as string) || undefined,
      location: (formData.get("location") as string) || undefined,
    };
    onSubmit(deviceData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editingItem ? "Edit Device" : "Create Device"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="device-name" className="text-gray-700 dark:text-gray-300">
                Name *
              </Label>
              <Input
                id="device-name"
                name="name"
                required
                defaultValue={editingItem?.name}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="device-description" className="text-gray-700 dark:text-gray-300">
                Description
              </Label>
              <Input
                id="device-description"
                name="description"
                defaultValue={editingItem?.description}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="device-type" className="text-gray-700 dark:text-gray-300">
                Device Type
              </Label>
              <Input
                id="device-type"
                name="device_type"
                defaultValue={editingItem?.device_type}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="device-location" className="text-gray-700 dark:text-gray-300">
                Location
              </Label>
              <Input
                id="device-location"
                name="location"
                defaultValue={editingItem?.location}
                className="mt-1"
              />
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
