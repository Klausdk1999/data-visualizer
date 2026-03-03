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
import { Plus, Edit, Trash2 } from "lucide-react";
import type { Product, RawMaterial, BillOfMaterials } from "@/types";

interface ProductsTabProps {
  products: Product[];
  rawMaterials: RawMaterial[];
  selectedProduct: number | null;
  bomEntries: BillOfMaterials[];
  onProductSelect: (productId: number) => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onAddBOMEntry: () => void;
  onDeleteBOMEntry: (bomId: number) => void;
}

export default function ProductsTab({
  products,
  rawMaterials,
  selectedProduct,
  bomEntries,
  onProductSelect,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddBOMEntry,
  onDeleteBOMEntry,
}: ProductsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white">Products</CardTitle>
          <Button onClick={onAddProduct} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow
                  key={product.id}
                  className={selectedProduct === product.id ? "bg-blue-100/50 dark:bg-blue-900/30" : ""}
                >
                  <TableCell className="text-gray-900 dark:text-gray-100">{product.id}</TableCell>
                  <TableCell
                    className="text-gray-900 dark:text-gray-100 cursor-pointer"
                    onClick={() => onProductSelect(product.id)}
                  >
                    {product.name}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {product.sku || "-"}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {product.category || "-"}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {product.unit || "-"}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {product.is_active ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditProduct(product)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteProduct(product.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedProduct && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gray-900 dark:text-white">Bill of Materials</CardTitle>
            <Button onClick={onAddBOMEntry} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Material
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Actions</TableHead>
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
                    <TableCell className="text-gray-900 dark:text-gray-100">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteBOMEntry(bom.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
