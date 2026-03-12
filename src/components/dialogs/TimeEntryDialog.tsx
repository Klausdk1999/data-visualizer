"use client";

import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TimeEntry, CreateTimeEntryRequest, ProductionOrder, Service, User } from "@/types";

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: TimeEntry | null;
  onSubmit: (data: CreateTimeEntryRequest) => void;
  productionOrders: ProductionOrder[];
  services: Service[];
  users: User[];
  currentUser: User | null;
}

export default function TimeEntryDialog({
  open, onOpenChange, editingItem, onSubmit,
  productionOrders, services, users, currentUser,
}: TimeEntryDialogProps) {
  const t = useTranslations("hours");
  const tc = useTranslations("common");

  const isWorker = currentUser?.type === "worker";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const entryData: CreateTimeEntryRequest = {
      user_id: isWorker && currentUser ? currentUser.id : Number(formData.get("user_id")),
      production_order_id: Number(formData.get("production_order_id")),
      service_id: Number(formData.get("service_id")),
      day: formData.get("day") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      observations: (formData.get("observations") as string) || undefined,
    };
    onSubmit(entryData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editingItem ? t("editEntry") : t("createEntry")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {!isWorker && (
              <div>
                <Label htmlFor="entry-user" className="text-gray-700 dark:text-gray-300">
                  {t("worker")} *
                </Label>
                <select
                  id="entry-user"
                  name="user_id"
                  required
                  defaultValue={editingItem?.user_id || ""}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">{t("selectWorker")}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label htmlFor="entry-order" className="text-gray-700 dark:text-gray-300">
                {t("order")} *
              </Label>
              <select
                id="entry-order"
                name="production_order_id"
                required
                defaultValue={editingItem?.production_order_id || ""}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">{t("selectOrder")}</option>
                {productionOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    OP #{order.id} - {order.product?.name || `Product #${order.product_id}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="entry-service" className="text-gray-700 dark:text-gray-300">
                {t("service")} *
              </Label>
              <select
                id="entry-service"
                name="service_id"
                required
                defaultValue={editingItem?.service_id || ""}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">{t("selectService")}</option>
                {services.filter(s => s.is_active).map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.code} - {service.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="entry-day" className="text-gray-700 dark:text-gray-300">
                {t("day")} *
              </Label>
              <Input id="entry-day" name="day" type="date" required defaultValue={editingItem?.day} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entry-start" className="text-gray-700 dark:text-gray-300">
                  {t("startTime")} *
                </Label>
                <Input id="entry-start" name="start_time" type="time" required defaultValue={editingItem?.start_time} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="entry-end" className="text-gray-700 dark:text-gray-300">
                  {t("endTime")} *
                </Label>
                <Input id="entry-end" name="end_time" type="time" required defaultValue={editingItem?.end_time} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="entry-observations" className="text-gray-700 dark:text-gray-300">
                {t("observations")}
              </Label>
              <textarea
                id="entry-observations"
                name="observations"
                rows={3}
                defaultValue={editingItem?.observations}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex items-center gap-2">
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
