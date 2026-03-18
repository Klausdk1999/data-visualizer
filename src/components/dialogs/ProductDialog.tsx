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
import { X, Save, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Product,
  RawMaterial,
  BillOfMaterials,
  CreateProductRequest,
  CreateBOMEntryRequest,
} from "@/types";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: Product | null;
  rawMaterials: RawMaterial[];
  bomEntries: BillOfMaterials[];
  onSubmit: (data: CreateProductRequest) => void;
  onAddBOMEntry: (data: CreateBOMEntryRequest) => void;
  onDeleteBOMEntry: (bomId: number) => void;
}

export default function ProductDialog({
  open,
  onOpenChange,
  editingItem,
  rawMaterials,
  bomEntries,
  onSubmit,
  onAddBOMEntry,
  onDeleteBOMEntry,
}: ProductDialogProps) {
  const t = useTranslations("products");
  const tc = useTranslations("common");

  const [newMaterialId, setNewMaterialId] = useState<string>("");
  const [newQuantity, setNewQuantity] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setNewMaterialId("");
      setNewQuantity("");
    }
  }, [open]);

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

  const handleAddMaterial = () => {
    if (!newMaterialId || !newQuantity) return;
    onAddBOMEntry({
      raw_material_id: Number(newMaterialId),
      quantity: Number(newQuantity),
    });
    setNewMaterialId("");
    setNewQuantity("");
  };

  // Filter out materials already in BOM
  const availableMaterials = rawMaterials.filter(
    (m) => !bomEntries.some((b) => b.raw_material_id === m.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {editingItem ? t("editProduct") : t("createProduct")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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

            {/* BOM Section - shown when editing an existing product */}
            {editingItem && (
              <div className="border-t pt-4 mt-4">
                <Label className="text-gray-700 dark:text-gray-300 text-base font-semibold">
                  {t("bom")}
                </Label>

                {bomEntries.length > 0 && (
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("materialName")}</TableHead>
                        <TableHead>{t("quantity")}</TableHead>
                        <TableHead>{tc("unit")}</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bomEntries.map((bom) => (
                        <TableRow key={bom.id}>
                          <TableCell className="text-gray-900 dark:text-gray-100">
                            {bom.raw_material?.name || bom.raw_material_id}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-gray-100">
                            {bom.quantity}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-gray-100">
                            {bom.raw_material?.unit || "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => onDeleteBOMEntry(bom.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Inline add material row */}
                <div className="flex items-end gap-2 mt-3">
                  <div className="flex-1">
                    <Label className="text-gray-700 dark:text-gray-300 text-xs">
                      {t("rawMaterial")}
                    </Label>
                    <select
                      value={newMaterialId}
                      onChange={(e) => setNewMaterialId(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">{t("selectMaterial")}</option>
                      {availableMaterials.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <Label className="text-gray-700 dark:text-gray-300 text-xs">
                      {t("quantity")}
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddMaterial}
                    disabled={!newMaterialId || !newQuantity}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {t("addMaterial")}
                  </Button>
                </div>
              </div>
            )}
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
