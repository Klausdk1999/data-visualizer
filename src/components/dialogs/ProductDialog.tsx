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
import type { Product, CreateProductRequest } from "@/types";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: Product | null;
  onSubmit: (data: CreateProductRequest) => void;
}

export default function ProductDialog({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
}: ProductDialogProps) {
  const t = useTranslations("products");
  const tc = useTranslations("common");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData: CreateProductRequest = {
      name: formData.get("name") as string,
      sku: (formData.get("sku") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      unit: (formData.get("unit") as string) || undefined,
      category: (formData.get("category") as string) || undefined,
    };
    onSubmit(productData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editingItem ? t("editProduct") : t("createProduct")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="product-name" className="text-gray-700 dark:text-gray-300">
                {tc("name")} *
              </Label>
              <Input
                id="product-name"
                name="name"
                required
                defaultValue={editingItem?.name}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="product-sku" className="text-gray-700 dark:text-gray-300">
                {t("sku")}
              </Label>
              <Input
                id="product-sku"
                name="sku"
                defaultValue={editingItem?.sku}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="product-description" className="text-gray-700 dark:text-gray-300">
                {tc("description")}
              </Label>
              <Input
                id="product-description"
                name="description"
                defaultValue={editingItem?.description}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="product-unit" className="text-gray-700 dark:text-gray-300">
                {tc("unit")}
              </Label>
              <Input
                id="product-unit"
                name="unit"
                defaultValue={editingItem?.unit}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="product-category" className="text-gray-700 dark:text-gray-300">
                {t("category")}
              </Label>
              <Input
                id="product-category"
                name="category"
                defaultValue={editingItem?.category}
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
