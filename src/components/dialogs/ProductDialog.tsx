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
            {editingItem ? "Edit Product" : "Create Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="product-name" className="text-gray-700 dark:text-gray-300">
                Name *
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
                SKU
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
                Description
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
                Unit
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
                Category
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
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
