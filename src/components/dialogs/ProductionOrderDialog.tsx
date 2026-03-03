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
import type {
  ProductionOrder,
  Product,
  Device,
  CreateProductionOrderRequest,
} from "@/types";

interface ProductionOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: ProductionOrder | null;
  products: Product[];
  devices: Device[];
  onSubmit: (data: CreateProductionOrderRequest) => void;
}

export default function ProductionOrderDialog({
  open,
  onOpenChange,
  editingItem,
  products,
  devices,
  onSubmit,
}: ProductionOrderDialogProps) {
  const t = useTranslations("orders");
  const tc = useTranslations("common");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const orderData: CreateProductionOrderRequest = {
      product_id: Number(formData.get("product_id")),
      quantity: Number(formData.get("quantity")),
      priority: formData.get("priority")
        ? Number(formData.get("priority"))
        : undefined,
      device_id: formData.get("device_id")
        ? Number(formData.get("device_id"))
        : undefined,
      work_instructions: (formData.get("work_instructions") as string) || undefined,
      quality_notes: (formData.get("quality_notes") as string) || undefined,
    };
    onSubmit(orderData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editingItem ? t("editOrder") : t("createOrder")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="order-product" className="text-gray-700 dark:text-gray-300">
                {t("product")} *
              </Label>
              <select
                id="order-product"
                name="product_id"
                required
                defaultValue={editingItem?.product_id ?? ""}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{t("selectProduct")}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="order-quantity" className="text-gray-700 dark:text-gray-300">
                {t("quantity")} *
              </Label>
              <Input
                id="order-quantity"
                name="quantity"
                type="number"
                step="any"
                min="0.01"
                required
                defaultValue={editingItem?.quantity}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="order-priority" className="text-gray-700 dark:text-gray-300">
                {t("priority")}
              </Label>
              <Input
                id="order-priority"
                name="priority"
                type="number"
                defaultValue={editingItem?.priority ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="order-device" className="text-gray-700 dark:text-gray-300">
                {t("device")}
              </Label>
              <select
                id="order-device"
                name="device_id"
                defaultValue={editingItem?.device_id ?? ""}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{tc("none")}</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="order-instructions" className="text-gray-700 dark:text-gray-300">
                {t("workInstructions")}
              </Label>
              <textarea
                id="order-instructions"
                name="work_instructions"
                defaultValue={editingItem?.work_instructions ?? ""}
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-vertical"
              />
            </div>
            <div>
              <Label htmlFor="order-quality-notes" className="text-gray-700 dark:text-gray-300">
                {t("qualityNotes")}
              </Label>
              <textarea
                id="order-quality-notes"
                name="quality_notes"
                defaultValue={editingItem?.quality_notes ?? ""}
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-vertical"
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
