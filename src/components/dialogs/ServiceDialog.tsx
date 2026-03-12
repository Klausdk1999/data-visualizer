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
import type { Service, CreateServiceRequest } from "@/types";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: Service | null;
  onSubmit: (data: CreateServiceRequest) => void;
}

export default function ServiceDialog({
  open, onOpenChange, editingItem, onSubmit,
}: ServiceDialogProps) {
  const t = useTranslations("services");
  const tc = useTranslations("common");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const serviceData: CreateServiceRequest = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
    };
    onSubmit(serviceData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editingItem ? t("editService") : t("createService")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="service-code" className="text-gray-700 dark:text-gray-300">
                {t("code")} *
              </Label>
              <Input id="service-code" name="code" required defaultValue={editingItem?.code} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="service-name" className="text-gray-700 dark:text-gray-300">
                {tc("name")} *
              </Label>
              <Input id="service-name" name="name" required defaultValue={editingItem?.name} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="service-description" className="text-gray-700 dark:text-gray-300">
                {tc("description")}
              </Label>
              <Input id="service-description" name="description" defaultValue={editingItem?.description} className="mt-1" />
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
