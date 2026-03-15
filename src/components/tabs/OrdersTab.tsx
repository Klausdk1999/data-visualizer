"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isOrderOverdue, orderOverdueDays } from "@/lib/orderUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Play, CheckCircle, XCircle, BarChart3, X, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
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
  isWorker?: boolean;
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

type SortField = "id" | "product" | "customer" | "quantity" | "status" | "priority" | "created_at";
type SortDir = "asc" | "desc";

export default function OrdersTab({
  orders,
  isWorker = false,
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

  // Filtering
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchText, setSearchText] = useState("");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  // Unique values for filters
  const statuses = useMemo(() => {
    const set = new Set(orders.map((o) => o.status));
    return Array.from(set).sort();
  }, [orders]);

  // Filtered + sorted orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (o) =>
          String(o.id).includes(q) ||
          (o.product?.name || "").toLowerCase().includes(q) ||
          (o.customer?.name || "").toLowerCase().includes(q) ||
          (o.device?.name || "").toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "id":
          cmp = a.id - b.id;
          break;
        case "product":
          cmp = (a.product?.name || "").localeCompare(b.product?.name || "");
          break;
        case "customer":
          cmp = (a.customer?.name || "").localeCompare(b.customer?.name || "");
          break;
        case "quantity":
          cmp = a.quantity - b.quantity;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "priority":
          cmp = (a.priority ?? 0) - (b.priority ?? 0);
          break;
        case "created_at":
          cmp = (a.created_at || "").localeCompare(b.created_at || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [orders, statusFilter, searchText, sortField, sortDir]);

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
  const chartData = useMemo(() => {
    if (orderSignalValues.length === 0) return [];

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

  const signalNames = useMemo(() => {
    const names = new Set<string>();
    for (const sv of orderSignalValues) {
      names.add(sv.signal?.name || `Signal ${sv.signal_id}`);
    }
    return Array.from(names);
  }, [orderSignalValues]);

  function getStatusBadge(order: ProductionOrder) {
    const overdue = isOrderOverdue(order);
    const days = orderOverdueDays(order);
  
    const styles: Record<string, string> = {
      planned:     "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
      completed:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
      cancelled:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    };
    const labels: Record<string, string> = {
      planned:     t("planned"),
      in_progress: t("inProgress"),
      completed:   t("completed"),
      cancelled:   t("cancelled"),
    };
  
    // Se está atrasada, sobrepõe o badge com visual de alerta
    if (overdue) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Badge do status atual (planejada ou em andamento) */}
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[order.status] ?? "bg-gray-100 text-gray-600"}`}>
            {labels[order.status] ?? order.status}
          </span>
          {/* Badge de atraso */}
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
            ⚠ {days > 0 && `${days}d`}
          </span>
        </div>
      );
    }
  
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[order.status] ?? "bg-gray-100 text-gray-600"}`}>
        {labels[order.status] ?? order.status}
      </span>
    );
  }

  const selectClass = "rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white">{t("title")}</CardTitle>
          {!isWorker && (
            <Button onClick={onAddOrder} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t("addOrder")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">{t("allStatuses")}</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {({ planned: t("planned"), in_progress: t("inProgress"), completed: t("completed"), cancelled: t("cancelled") } as Record<string, string>)[s] || s}
                </option>
              ))}
            </select>
            {(statusFilter || searchText) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStatusFilter(""); setSearchText(""); }}
                className="flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                {t("clearFilters")}
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button type="button" className="flex items-center font-medium" onClick={() => handleSort("id")}>
                    {tc("id")}<SortIcon field="id" />
                  </button>
                </TableHead>
                <TableHead>
                  <button type="button" className="flex items-center font-medium" onClick={() => handleSort("product")}>
                    {t("product")}<SortIcon field="product" />
                  </button>
                </TableHead>
                <TableHead>
                  <button type="button" className="flex items-center font-medium" onClick={() => handleSort("customer")}>
                    {t("customer")}<SortIcon field="customer" />
                  </button>
                </TableHead>
                <TableHead>
                  <button type="button" className="flex items-center font-medium" onClick={() => handleSort("quantity")}>
                    {t("quantity")}<SortIcon field="quantity" />
                  </button>
                </TableHead>
                <TableHead>
                  <button type="button" className="flex items-center font-medium" onClick={() => handleSort("status")}>
                    {tc("status")}<SortIcon field="status" />
                  </button>
                </TableHead>
                <TableHead>
                  <button type="button" className="flex items-center font-medium" onClick={() => handleSort("priority")}>
                    {t("priority")}<SortIcon field="priority" />
                  </button>
                </TableHead>
                <TableHead>{t("device")}</TableHead>
                <TableHead>{t("started")}</TableHead>
                <TableHead>{t("completedDate")}</TableHead>
                <TableHead>{t("plannedDeliveryDate")}</TableHead>
                <TableHead>{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-gray-500 py-8">
                    {tc("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={selectedOrder?.id === order.id ? "bg-blue-50 dark:bg-blue-950" : ""}
                  >
                    <TableCell className="text-gray-900 dark:text-gray-100">{order.id}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">
                      {order.product?.name || order.product_id}
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">
                      {order.customer?.name || "-"}
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">
                      {order.quantity}
                    </TableCell>
                    <TableCell>{getStatusBadge(order)}</TableCell>
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
                      {order.planned_delivery_date
                        ? new Date(order.planned_delivery_date).toLocaleDateString()
                        : "-"}
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
                        {!isWorker && order.status === "planned" && (
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
                        {!isWorker && order.status === "in_progress" && (
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
                        {!isWorker && (order.status === "planned" || order.status === "in_progress") && (
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
                        {!isWorker && (order.status === "planned" || order.status === "in_progress") && (
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
                        {!isWorker && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDeleteOrder(order.id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            {tc("delete")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
