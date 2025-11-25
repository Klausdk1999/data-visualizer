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
import { X, Plus } from "lucide-react";
import type { CreateSignalValueRequest } from "@/types";

interface SignalValueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSignal: number | null;
  onSubmit: (data: CreateSignalValueRequest) => void;
}

export default function SignalValueDialog({
  open,
  onOpenChange,
  selectedSignal,
  onSubmit,
}: SignalValueDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const valueData: CreateSignalValueRequest = {
      signal_id: Number(formData.get("signal_id")),
      value: formData.get("value") ? Number(formData.get("value")) : undefined,
      digital_value:
        formData.get("digital_value") === "true"
          ? true
          : formData.get("digital_value") === "false"
            ? false
            : undefined,
    };
    onSubmit(valueData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Create Signal Value</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="value-signal-id" className="text-gray-900">
                Signal ID *
              </Label>
              <Input
                id="value-signal-id"
                name="signal_id"
                type="number"
                required
                defaultValue={selectedSignal || undefined}
                className="mt-1 bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="value-value" className="text-gray-900">
                Value (for analogic)
              </Label>
              <Input
                id="value-value"
                name="value"
                type="number"
                step="any"
                className="mt-1 bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="value-digital" className="text-gray-900">
                Digital Value (for digital)
              </Label>
              <select
                id="value-digital"
                name="digital_value"
                className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white text-gray-900"
              >
                <option value="">None</option>
                <option value="true">True</option>
                <option value="false">False</option>
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
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
