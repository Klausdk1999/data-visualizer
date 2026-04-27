"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { printProductionOrder } from "@/lib/printOrder";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchableSelect } from "@/components/ui/combobox";
import type {
  ProductionOrder,
  Product,
  Device,
  Customer,
  CreateProductionOrderRequest,
} from "@/types";

interface ProductionOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: ProductionOrder | null;
  products: Product[];
  devices: Device[];
  customers: Customer[];
  onSubmit: (data: CreateProductionOrderRequest) => void;
}

export default function ProductionOrderDialog({
  open,
  onOpenChange,
  editingItem,
  products,
  devices,
  customers,
  onSubmit,
}: ProductionOrderDialogProps) {
  const t = useTranslations("orders");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isPT = locale === "pt-BR";
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [deviceId, setDeviceId] = useState("");

  const productOptions = products.map((p) => ({ value: String(p.id), label: p.name }));
  const deviceOptions = devices.map((d) => ({ value: String(d.id), label: d.name }));
  const customerOptions = customers.map((c) => ({ value: String(c.id), label: c.name }));

  useEffect(() => {
    if (open) {
      setProductId(editingItem?.product_id ? String(editingItem.product_id) : "");
      setDeviceId(editingItem?.device_id ? String(editingItem.device_id) : "");
      setCustomerId(editingItem?.customer_id ? String(editingItem.customer_id) : "");
    }
  }, [open, editingItem]);

  // Convert ISO string to separate date and time values
  const toDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const toTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Combine date + time inputs into ISO string
  const combineDatetime = (date: string, time: string): string | undefined => {
    if (!date) return undefined;
    const datetime = time ? `${date}T${time}` : `${date}T00:00`;
    return new Date(datetime).toISOString();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Find the customer name from the selected customer id
    const selectedCustomer = customers.find((c) => String(c.id) === customerId);
    const orderData: CreateProductionOrderRequest = {
      product_id: Number(productId),
      quantity: Number(formData.get("quantity")),
      priority: formData.get("priority") ? Number(formData.get("priority")) : undefined,
      device_id: deviceId ? Number(deviceId) : undefined,
      customer_name: selectedCustomer?.name || undefined,
      started_at: combineDatetime(
        formData.get("started_date") as string,
        formData.get("started_time") as string
      ),
      completed_at: combineDatetime(
        formData.get("completed_date") as string,
        formData.get("completed_time") as string
      ),
      planned_delivery_date: combineDatetime(
        formData.get("planned_delivery_date") as string,
        "00:00"
      ),
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
              <SearchableSelect
                id="order-product"
                options={productOptions}
                value={productId}
                onChange={setProductId}
                placeholder={t("selectProduct")}
                searchPlaceholder={tc("search")}
                notFoundText={tc("noResults")}
                required
              />
            </div>
            <div>
              <Label htmlFor="order-customer" className="text-gray-700 dark:text-gray-300">
                {t("customer")}
              </Label>
              <SearchableSelect
                id="order-customer"
                options={[{ value: "", label: tc("none") }, ...customerOptions]}
                value={customerId}
                onChange={setCustomerId}
                placeholder={tc("none")}
                searchPlaceholder={tc("search")}
                notFoundText={tc("noResults")}
              />
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
              <SearchableSelect
                id="order-device"
                options={[{ value: "", label: tc("none") }, ...deviceOptions]}
                value={deviceId}
                onChange={setDeviceId}
                placeholder={tc("none")}
                searchPlaceholder={tc("search")}
                notFoundText={tc("noResults")}
              />
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">{t("startDate")}</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  id="order-started-date"
                  name="started_date"
                  type="date"
                  defaultValue={toDate(editingItem?.started_at)}
                />
                <Input
                  id="order-started-time"
                  name="started_time"
                  type="time"
                  defaultValue={toTime(editingItem?.started_at)}
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">{t("endDate")}</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  id="order-completed-date"
                  name="completed_date"
                  type="date"
                  defaultValue={toDate(editingItem?.completed_at)}
                />
                <Input
                  id="order-completed-time"
                  name="completed_time"
                  type="time"
                  defaultValue={toTime(editingItem?.completed_at)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="order-delivery-date" className="text-gray-700 dark:text-gray-300">
                {t("plannedDeliveryDate")}
              </Label>
              <Input
                id="order-delivery-date"
                name="planned_delivery_date"
                type="date"
                defaultValue={toDate(editingItem?.planned_delivery_date)}
                className="mt-1"
              />
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
            {editingItem && (
              <Button
                type="button"
                variant="outline"
                onClick={() => printProductionOrder(editingItem, locale)}
                className="flex items-center gap-2 mr-auto"
              >
                <Printer className="w-4 h-4" />
                {isPT ? "Imprimir OS" : "Print Order"}
              </Button>
            )}
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
