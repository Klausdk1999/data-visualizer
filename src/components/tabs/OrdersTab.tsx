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
import { Plus, Edit, Trash2, Play, CheckCircle, XCircle } from "lucide-react";
import type { ProductionOrder } from "@/types";

interface OrdersTabProps {
  orders: ProductionOrder[];
  onAddOrder: () => void;
  onEditOrder: (order: ProductionOrder) => void;
  onDeleteOrder: (orderId: number) => void;
  onUpdateStatus: (orderId: number, status: string) => void;
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    planned: "bg-gray-100 text-gray-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    planned: "Planned",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {labels[status] || status}
    </span>
  );
}

export default function OrdersTab({
  orders,
  onAddOrder,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
}: OrdersTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-900 dark:text-white">Production Orders</CardTitle>
        <Button onClick={onAddOrder} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Order
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="text-gray-900 dark:text-gray-100">{order.id}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {order.product?.name || order.product_id}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {order.quantity}
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {order.priority != null ? order.priority : "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {order.device?.name || order.device_id || "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {order.started_at ? new Date(order.started_at).toLocaleString() : "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  {order.completed_at ? new Date(order.completed_at).toLocaleString() : "-"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-100">
                  <div className="flex space-x-2">
                    {order.status === "planned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateStatus(order.id, "in_progress")}
                        className="flex items-center gap-1 text-blue-700 border-blue-300"
                      >
                        <Play className="w-3 h-3" />
                        Start
                      </Button>
                    )}
                    {order.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateStatus(order.id, "completed")}
                        className="flex items-center gap-1 text-green-700 border-green-300"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Complete
                      </Button>
                    )}
                    {(order.status === "planned" || order.status === "in_progress") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateStatus(order.id, "cancelled")}
                        className="flex items-center gap-1 text-red-700 border-red-300"
                      >
                        <XCircle className="w-3 h-3" />
                        Cancel
                      </Button>
                    )}
                    {(order.status === "planned" || order.status === "in_progress") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditOrder(order)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteOrder(order.id)}
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
  );
}
