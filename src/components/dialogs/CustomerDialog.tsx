"use client";

import React, { useState, useEffect } from "react";
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
import type { Customer, CreateCustomerRequest } from "@/types";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: Customer | null;
  onSubmit: (data: CreateCustomerRequest) => void;
}

export default function CustomerDialog({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
}: CustomerDialogProps) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (open) {
      setName(editingItem?.name ?? "");
      setPhone(editingItem?.phone ?? "");
      setCnpj(editingItem?.cnpj ?? "");
      setAddress(editingItem?.address ?? "");
    }
  }, [open, editingItem]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data: CreateCustomerRequest = {
      name: name.trim(),
      phone: phone.trim(),
      cnpj: cnpj.trim() || undefined,
      address: address.trim() || undefined,
    };
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editingItem ? t("editCustomer") : t("createCustomer")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="customer-name" className="text-gray-700 dark:text-gray-300">
                {tc("name")} *
              </Label>
              <Input
                id="customer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="customer-phone" className="text-gray-700 dark:text-gray-300">
                {t("phone")} *
              </Label>
              <Input
                id="customer-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-1"
                autoComplete="off"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label htmlFor="customer-cnpj" className="text-gray-700 dark:text-gray-300">
                {t("cnpj")}
              </Label>
              <Input
                id="customer-cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="mt-1"
                autoComplete="off"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <Label htmlFor="customer-address" className="text-gray-700 dark:text-gray-300">
                {t("address")}
              </Label>
              <textarea
                id="customer-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-vertical"
                placeholder={t("address")}
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
