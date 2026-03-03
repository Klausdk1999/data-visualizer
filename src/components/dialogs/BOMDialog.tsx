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
import type { RawMaterial, CreateBOMEntryRequest } from "@/types";

interface BOMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawMaterials: RawMaterial[];
  onSubmit: (data: CreateBOMEntryRequest) => void;
}

export default function BOMDialog({
  open,
  onOpenChange,
  rawMaterials,
  onSubmit,
}: BOMDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bomData: CreateBOMEntryRequest = {
      raw_material_id: Number(formData.get("raw_material_id")),
      quantity: Number(formData.get("quantity")),
    };
    onSubmit(bomData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            Add Bill of Materials Entry
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="bom-material" className="text-gray-700 dark:text-gray-300">
                Raw Material *
              </Label>
              <select
                id="bom-material"
                name="raw_material_id"
                required
                defaultValue=""
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a material</option>
                {rawMaterials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="bom-quantity" className="text-gray-700 dark:text-gray-300">
                Quantity *
              </Label>
              <Input
                id="bom-quantity"
                name="quantity"
                type="number"
                step="any"
                min="0.01"
                required
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
