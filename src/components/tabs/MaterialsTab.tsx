"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, PackagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RawMaterial } from "@/types";

interface MaterialsTabProps {
  materials: RawMaterial[];
  onAddMaterial: () => void;
  onEditMaterial: (material: RawMaterial) => void;
  onDeleteMaterial: (materialId: number) => void;
  onAdjustStock: (material: RawMaterial) => void;
}

function getStockColor(stock: number, minStock?: number): string {
  if (minStock == null) return "text-green-600 dark:text-green-400";
  if (stock <= minStock) return "text-red-600 dark:text-red-400";
  if (stock <= minStock * 1.5) return "text-orange-600 dark:text-orange-400";
  return "text-green-600 dark:text-green-400";
}

export default function MaterialsTab({
  materials,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onAdjustStock,
}: MaterialsTabProps) {
  const t = useTranslations("materials");
  const tc = useTranslations("common");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-900 dark:text-white">{t("title")}</CardTitle>
        <Button onClick={onAddMaterial} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t("addMaterial")}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("id")}</TableHead>
              <TableHead>{tc("name")}</TableHead>
              <TableHead>{t("sku")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("unit")}</TableHead>
              <TableHead>{t("stock")}</TableHead>
              <TableHead>{t("minStock")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              <TableHead>{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material) => (
              <TableRow key={material.id}>
                <TableCell className="text-gray-900 dark:text-gray-100">{material.id}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {material.name}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {material.sku || "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {material.category || "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {material.unit || "-"}
                </TableCell>
                <TableCell className={getStockColor(material.stock_quantity, material.min_stock)}>
                  {material.stock_quantity}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {material.min_stock != null ? material.min_stock : "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {material.is_active ? tc("active") : tc("inactive")}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditMaterial(material)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      {tc("edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteMaterial(material.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      {tc("delete")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAdjustStock(material)}
                      className="flex items-center gap-1"
                    >
                      <PackagePlus className="w-3 h-3" />
                      {t("adjust")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
