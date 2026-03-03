"use client";

import React, { useState } from "react";
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
import { Plus, Edit, Trash2, Play, CheckCircle, XCircle, BarChart3, X } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getOrderSignalValues } from "@/lib/requestHandlers";
import { useTranslations } from "next-intl";
import type { ProductionOrder, SignalValue } from "@/types";

interface OrdersTabProps {
  orders: ProductionOrder[];
  onAddOrder: () => void;
  onEditOrder: (order: ProductionOrder) => void;
  onDeleteOrder: (orderId: number) => void;
  onUpdateStatus: (orderId: number, status: string) => void;
}

const LINE_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

export default function OrdersTab({
  orders,
  onAddOrder,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
}: OrdersTabProps) {
  const t = useTranslations("orders");
  const tc = useTranslations("common");
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [orderSignalValues, setOrderSignalValues] = useState<SignalValue[]>([]);
  const [loadingSignals, setLoadingSignals] = useState(false);

  const handleViewSignals = async (order: ProductionOrder) => {
    if (selectedOrder?.id === order.id) {
      setSelectedOrder(null);
      setOrderSignalValues([]);
      return;
    }

    setSelectedOrder(order);
    setLoadingSignals(true);
    try {
      const values = await getOrderSignalValues(String(order.id));
      setOrderSignalValues(values || []);
    } catch {
      setOrderSignalValues([]);
    } finally {
      setLoadingSignals(false);
    }
  };

  // Group signal values by timestamp for the chart
  const chartData = React.useMemo(() => {
    if (orderSignalValues.length === 0) return [];

    // Group by timestamp, with each signal as a separate key
    const timestampMap = new Map<string, Record<string, number | string>>();

    for (const sv of orderSignalValues) {
      const ts = sv.timestamp;
      const signalName = sv.signal?.name || `Signal ${sv.signal_id}`;
      const value = sv.value ?? (sv.digital_value ? 1 : 0);

      if (!timestampMap.has(ts)) {
        timestampMap.set(ts, { timestamp: new Date(ts).toLocaleString() });
      }
      const entry = timestampMap.get(ts)!;
      entry[signalName] = value;
    }

    return Array.from(timestampMap.values());
  }, [orderSignalValues]);

  // Get unique signal names for creating lines
  const signalNames = React.useMemo(() => {
    const names = new Set<string>();
    for (const sv of orderSignalValues) {
      names.add(sv.signal?.name || `Signal ${sv.signal_id}`);
    }
    return Array.from(names);
  }, [orderSignalValues]);

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      planned: "bg-gray-100 text-gray-700",
      in_progress: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      planned: t("planned"),
      in_progress: t("inProgress"),
      completed: t("completed"),
      cancelled: t("cancelled"),
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
      >
        {labels[status] || status}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white">{t("title")}</CardTitle>
          <Button onClick={onAddOrder} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t("addOrder")}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tc("id")}</TableHead>
                <TableHead>{t("product")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{tc("status")}</TableHead>
                <TableHead>{t("priority")}</TableHead>
                <TableHead>{t("device")}</TableHead>
                <TableHead>{t("started")}</TableHead>
                <TableHead>{t("completed")}</TableHead>
                <TableHead>{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className={selectedOrder?.id === order.id ? "bg-blue-50 dark:bg-blue-950" : ""}
                >
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
                      {order.device_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSignals(order)}
                          className={`flex items-center gap-1 ${
                            selectedOrder?.id === order.id
                              ? "text-blue-700 border-blue-500 bg-blue-100"
                              : ""
                          }`}
                        >
                          {selectedOrder?.id === order.id ? (
                            <X className="w-3 h-3" />
                          ) : (
                            <BarChart3 className="w-3 h-3" />
                          )}
                          {t("signals")}
                        </Button>
                      )}
                      {order.status === "planned" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateStatus(order.id, "in_progress")}
                          className="flex items-center gap-1 text-blue-700 border-blue-300"
                        >
                          <Play className="w-3 h-3" />
                          {t("startOrder")}
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
                          {t("completeOrder")}
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
                          {t("cancelOrder")}
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
                          {tc("edit")}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteOrder(order.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        {tc("delete")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("deviceSignalValues", { orderId: selectedOrder.id })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSignals ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                {t("loadingSignalValues")}
              </div>
            ) : orderSignalValues.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                {t("noSignalValues")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {signalNames.map((name, index) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={LINE_COLORS[index % LINE_COLORS.length]}
                      dot={{ r: 2 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
