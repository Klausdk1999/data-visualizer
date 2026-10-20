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
import type { Company, CreateCompanyRequest } from "@/types";

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: Company | null;
  onSubmit: (data: CreateCompanyRequest) => void;
}

export default function CompanyDialog({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
}: CompanyDialogProps) {
  const t = useTranslations("companies");
  const tc = useTranslations("common");

  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");

  useEffect(() => {
    if (open) {
      setName(editingItem?.name ?? "");
      setCnpj(editingItem?.cnpj ?? "");
    }
  }, [open, editingItem]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data: CreateCompanyRequest = {
      name: name.trim(),
      cnpj: cnpj.trim() || undefined,
    };
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editingItem ? t("editCompany") : t("createCompany")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="company-name" className="text-gray-700 dark:text-gray-300">
                {tc("name")} *
              </Label>
              <Input
                id="company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="company-cnpj" className="text-gray-700 dark:text-gray-300">
                {t("cnpj")}
              </Label>
              <Input
                id="company-cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="mt-1"
                autoComplete="off"
                placeholder="00.000.000/0000-00"
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
