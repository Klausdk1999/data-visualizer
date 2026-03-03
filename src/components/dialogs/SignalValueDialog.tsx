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
import { useTranslations } from "next-intl";
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
  const t = useTranslations("signalValues");
  const tc = useTranslations("common");

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">{t("createValue")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="value-signal-id" className="text-gray-700 dark:text-gray-300">
                {t("signalId")} *
              </Label>
              <Input
                id="value-signal-id"
                name="signal_id"
                type="number"
                required
                defaultValue={selectedSignal || undefined}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="value-value" className="text-gray-700 dark:text-gray-300">
                {t("valueAnalogic")}
              </Label>
              <Input id="value-value" name="value" type="number" step="any" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="value-digital" className="text-gray-700 dark:text-gray-300">
                {t("digitalValueDigital")}
              </Label>
              <select
                id="value-digital"
                name="digital_value"
                className="mt-1 w-full h-10 rounded-xl border border-gray-300/50 bg-white/70 backdrop-blur-sm px-3 text-gray-900 dark:bg-gray-700/60 dark:border-gray-600/50 dark:text-gray-100 transition-all"
              >
                <option value="">{tc("none")}</option>
                <option value="true">{t("true")}</option>
                <option value="false">{t("false")}</option>
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
              {tc("cancel")}
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {tc("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
