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
import { useTranslations } from "next-intl";
import type { RawMaterial, CreateRawMaterialRequest } from "@/types";

interface RawMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: RawMaterial | null;
  onSubmit: (data: CreateRawMaterialRequest) => void;
}

export default function RawMaterialDialog({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
}: RawMaterialDialogProps) {
  const t = useTranslations("materials");
  const tc = useTranslations("common");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const materialData: CreateRawMaterialRequest = {
      name: formData.get("name") as string,
      sku: (formData.get("sku") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      unit: (formData.get("unit") as string) || undefined,
      category: (formData.get("category") as string) || undefined,
      min_stock: formData.get("min_stock")
        ? Number(formData.get("min_stock"))
        : undefined,
    };
    onSubmit(materialData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editingItem ? t("editMaterial") : t("createMaterial")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="material-name" className="text-gray-700 dark:text-gray-300">
                {tc("name")} *
              </Label>
              <Input
                id="material-name"
                name="name"
                required
                defaultValue={editingItem?.name}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="material-sku" className="text-gray-700 dark:text-gray-300">
                {t("sku")}
              </Label>
              <Input
                id="material-sku"
                name="sku"
                defaultValue={editingItem?.sku}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="material-description" className="text-gray-700 dark:text-gray-300">
                {tc("description")}
              </Label>
              <Input
                id="material-description"
                name="description"
                defaultValue={editingItem?.description}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="material-unit" className="text-gray-700 dark:text-gray-300">
                {t("unit")}
              </Label>
              <Input
                id="material-unit"
                name="unit"
                defaultValue={editingItem?.unit}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="material-category" className="text-gray-700 dark:text-gray-300">
                {t("category")}
              </Label>
              <Input
                id="material-category"
                name="category"
                defaultValue={editingItem?.category}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="material-min-stock" className="text-gray-700 dark:text-gray-300">
                {t("minStock")}
              </Label>
              <Input
                id="material-min-stock"
                name="min_stock"
                type="number"
                step="any"
                defaultValue={editingItem?.min_stock ?? ""}
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
              {tc("cancel")}
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
