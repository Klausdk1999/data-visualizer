"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cpu, Gauge, ClipboardList, Wrench, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { getSignals, getSignalValues } from "@/lib/requestHandlers";
import { useTranslations } from "next-intl";
import type { Device, Signal, SignalValue, ProductionOrder, TimeEntry, RawMaterial } from "@/types";

interface DashboardTabProps {
  devices: Device[];
  signals: Signal[];
  orders: ProductionOrder[];      
  timeEntries: TimeEntry[];
  rawMaterials: RawMaterial[];       
}

export default function DashboardTab({ devices, signals, orders, timeEntries, rawMaterials = [] }: DashboardTabProps) {
  const t = useTranslations("dashboardTab");
  const tc = useTranslations("common");
  const [dashboardDevice, setDashboardDevice] = useState<number | null>(null);
  const [latestSignalValues, setLatestSignalValues] = useState<Map<number, SignalValue>>(new Map());
  const totalOrdens = orders.length;
  const emAndamento = orders.filter((o) => o.status === "in_progress").length;
  const concluidas = orders.filter((o) => o.status === "completed").length;
  const totalHoras = timeEntries.reduce((acc, e) => {
  const [sh, sm] = e.start_time.split(":").map(Number);
  const [eh, em] = e.end_time.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  
  return acc + Math.max(0, diff / 60);
}, 0);
  
  const lowStockItems = rawMaterials.filter(
    (m) => m.min_stock !== undefined && m.min_stock !== null && m.stock_quantity <= m.min_stock
  );
  useEffect(() => {
    if (dashboardDevice) {
      fetchLatestSignalValues(dashboardDevice);
    }
  }, [dashboardDevice]);

  const fetchLatestSignalValues = async (deviceId: number) => {
    try {
      const deviceSignals = await getSignals({ device_id: deviceId.toString() });
      const latestValues = new Map<number, SignalValue>();

      for (const signal of deviceSignals) {
        const values = await getSignalValues({
          signal_id: signal.id.toString(),
          limit: "1",
        });
        if (values.length > 0) {
          latestValues.set(signal.id, values[0]);
        }
      }

      setLatestSignalValues(latestValues);
    } catch (error) {
      console.error("Error fetching latest signal values:", error);
    }
  };

  const deviceSignals = signals.filter((s) => s.device_id === dashboardDevice);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {
           <div className="grid grid-cols-4 gap-4 mb-6">
           {[
             {
               label: "TOTAL DE ORDENS",
               value: totalOrdens,
               sub: "ordens cadastradas",
               color: "from-blue-500 to-blue-700",
               icon: <ClipboardList className="w-10 h-10 opacity-20" />,
             },
             {
               label: "EM ANDAMENTO",
               value: emAndamento,
               sub: "ordens ativas",
               color: "from-yellow-500 to-yellow-600",
               icon: <Wrench className="w-10 h-10 opacity-20" />,
             },
             {
               label: "CONCLUÍDAS",
               value: concluidas,
               sub: "ordens finalizadas",
               color: "from-green-500 to-green-700",
               icon: <CheckCircle className="w-10 h-10 opacity-20" />,
             },
             {
               label: "TOTAL DE HORAS",
               value: `${totalHoras.toFixed(1)}h`,
               sub: "horas registradas",
               color: "from-violet-500 to-violet-700",
               icon: <Clock className="w-10 h-10 opacity-20" />,
             },
           ].map((card) => (
             <div
               key={card.label}
               className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} p-5 text-white`}
             >
               <div className="absolute right-4 top-4">{card.icon}</div>
               <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                 {card.label}
               </p>
               <p className="mt-2 text-4xl font-black">{card.value}</p>
               <p className="mt-1 text-xs opacity-60">{card.sub}</p>
             </div>
           ))}
           
         </div>
         
        }
        {lowStockItems.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 px-4 py-3 mb-6">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Estoque de materiais sem alertas
            </p>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
            
            {/* Cabeçalho do alerta */}
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 px-4 py-3 border-b border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-sm font-bold text-red-700 dark:text-red-400">
                {lowStockItems.length} {lowStockItems.length === 1 ? "material abaixo" : "materiais abaixo"} do estoque mínimo
              </p>
            </div>

            {/* Lista com scroll fixo */}
            <div className="h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 hover:bg-red-50/40 dark:hover:bg-red-900/10 transition-colors"
                >
                  {/* Nome e unidade */}
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {item.name}
                    </p>
                    {item.sku && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">{item.sku}</p>
                    )}
                  </div>

                  {/* Qtd atual vs mínimo */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 dark:text-gray-500">Atual</p>
                      <p className="text-sm font-black text-red-600 dark:text-red-400">
                        {item.stock_quantity} <span className="font-normal text-xs">{item.unit || "un"}</span>
                      </p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-600" />
                    <div className="text-right">
                      <p className="text-xs text-gray-400 dark:text-gray-500">Mínimo</p>
                      <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                        {item.min_stock} <span className="font-normal text-xs">{item.unit || "un"}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
      )}
        
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="dashboard-device"
              className="text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              {t("selectDevice")}
            </Label>
            <select
              id="dashboard-device"
              value={dashboardDevice || ""}
              onChange={(e) => setDashboardDevice(e.target.value ? Number(e.target.value) : null)}
              className="w-full h-10 rounded-xl border border-gray-300/50 bg-white/70 backdrop-blur-sm text-gray-900 dark:bg-gray-700/60 dark:border-gray-600/50 dark:text-gray-100 px-3 transition-all"
            >
              <option value="">{t("selectDevicePlaceholder")}</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.device_type || "N/A"})
                </option>
              ))}
            </select>
          </div>

          {dashboardDevice && (
            <div className="mt-6">
              <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">
                {t("latestSignalValues")}
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("signalName")}</TableHead>
                    <TableHead>{tc("type")}</TableHead>
                    <TableHead>{t("unit")}</TableHead>
                    <TableHead>{t("latestValue")}</TableHead>
                    <TableHead>{t("timestamp")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deviceSignals.map((signal) => {
                    const latestValue = latestSignalValues.get(signal.id);
                    return (
                      <TableRow key={signal.id}>
                        <TableCell className="text-gray-900 dark:text-gray-100">
                          {signal.name}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">
                          {signal.signal_type}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">
                          {signal.unit || "-"}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">
                          {latestValue
                            ? latestValue.value !== null && latestValue.value !== undefined
                              ? `${latestValue.value}${signal.unit ? ` ${signal.unit}` : ""}`
                              : latestValue.digital_value !== null &&
                                  latestValue.digital_value !== undefined
                                ? latestValue.digital_value.toString()
                                : "N/A"
                            : t("noData")}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">
                          {latestValue ? new Date(latestValue.timestamp).toLocaleString() : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {deviceSignals.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-gray-700 dark:text-gray-400 text-center"
                      >
                        {t("noSignals")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
