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
import type { AdjustStockRequest } from "@/types";

interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialName: string;
  onSubmit: (data: AdjustStockRequest) => void;
}

export default function StockAdjustDialog({
  open,
  onOpenChange,
  materialName,
  onSubmit,
}: StockAdjustDialogProps) {
  const t = useTranslations("materials");
  const tc = useTranslations("common");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const adjustData: AdjustStockRequest = {
      movement_type: formData.get("movement_type") as "in" | "out" | "adjustment",
      quantity: Number(formData.get("quantity")),
      notes: (formData.get("notes") as string) || undefined,
    };
    onSubmit(adjustData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {t("adjustStock")} - {materialName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="adjust-type" className="text-gray-700 dark:text-gray-300">
                {t("movementType")} *
              </Label>
              <select
                id="adjust-type"
                name="movement_type"
                required
                defaultValue="in"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="in">{t("in")}</option>
                <option value="out">{t("out")}</option>
                <option value="adjustment">{t("adjustment")}</option>
              </select>
            </div>
            <div>
              <Label htmlFor="adjust-quantity" className="text-gray-700 dark:text-gray-300">
                {tc("quantity")} *
              </Label>
              <Input
                id="adjust-quantity"
                name="quantity"
                type="number"
                step="any"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="adjust-notes" className="text-gray-700 dark:text-gray-300">
                {tc("notes")}
              </Label>
              <Input
                id="adjust-notes"
                name="notes"
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
