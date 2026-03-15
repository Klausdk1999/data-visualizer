"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, ClipboardList, Wrench, CheckCircle, Clock, AlertTriangle, CalendarClock, PackageOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProductionOrder, TimeEntry, RawMaterial } from "@/types";

interface DashboardTabProps {
  devices: unknown[];
  signals: unknown[];
  orders: ProductionOrder[];
  timeEntries: TimeEntry[];
  rawMaterials: RawMaterial[];
}

export default function DashboardTab({
  orders,
  timeEntries,
  rawMaterials = [],
}: DashboardTabProps) {
  const t = useTranslations("dashboardTab");
  const [dayFilter, setDayFilter] = useState<7 | 15 | 30>(30);

  // ── today declarado primeiro, pois é usado em todos os cálculos abaixo ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── KPIs filtrados por período ──
  const filteredByPeriod = orders.filter((o) => {
    const created = new Date(o.created_at || "");
    const diffDays = (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= dayFilter;
  });
 
  const totalOrdens = filteredByPeriod.length;
  const emAndamento = filteredByPeriod.filter((o) => o.status === "in_progress").length;
  const concluidas = filteredByPeriod.filter((o) => o.status === "completed").length;
  const totalHoras = timeEntries
    .filter((e) => {
      const entryDate = new Date(e.day || "");
      const diffDays = (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= dayFilter;
    })
    .reduce((acc, e) => {
      const [sh, sm] = e.start_time.split(":").map(Number);
      const [eh, em] = e.end_time.split(":").map(Number);
      return acc + Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
    }, 0);

  // ── Estoque baixo ──
  const lowStockItems = rawMaterials.filter(
    (m) => m.min_stock !== undefined && m.min_stock !== null && m.stock_quantity <= m.min_stock
  );

  // ── Ordens atrasadas ──
  const overdueOrders = orders.filter((o) => {
    if (o.status === "completed" || o.status === "cancelled") return false;
    if (!o.planned_delivery_date) return false;
    return new Date(o.planned_delivery_date) < today;
  });

  // ── Próximas a vencer (7 dias) ──
  const upcomingOrders = orders
    .filter((o) => {
      if (o.status === "completed" || o.status === "cancelled") return false;
      if (!o.planned_delivery_date) return false;
      const delivery = new Date(o.planned_delivery_date);
      const diffDays = Math.ceil((delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    })
    .sort(
      (a, b) =>
        new Date(a.planned_delivery_date!).getTime() -
        new Date(b.planned_delivery_date!).getTime()
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ══ SEÇÃO: ORDENS ══ */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">

          {/* Cabeçalho + filtro de período */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Ordens de Produção
            </h3>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/60 rounded-lg p-1">
              {([7, 15, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDayFilter(d)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    dayFilter === d
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">{card.label}</p>
                <p className="mt-2 text-4xl font-black">{card.value}</p>
                <p className="mt-1 text-xs opacity-60">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Alerta: ordens atrasadas */}
          {overdueOrders.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-red-600 px-4 py-3 text-white">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">
                  {overdueOrders.length}{" "}
                  {overdueOrders.length === 1 ? "ordem atrasada" : "ordens atrasadas"}
                </p>
                <p className="text-xs opacity-75">
                  {overdueOrders.map((o) => o.product?.name || `#${o.id}`).join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Tabela: próximas a vencer */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <CalendarClock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Próximas entregas (7 dias)
              </p>
            </div>
            <div className="h-36 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {upcomingOrders.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">
                  Nenhuma entrega prevista nos próximos 7 dias
                </div>
              ) : (
                upcomingOrders.map((order) => {
                  const delivery = new Date(order.planned_delivery_date!);
                  const diffDays = Math.ceil(
                    (delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const isUrgent = diffDays <= 2;
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {order.product?.name || `Ordem #${order.id}`}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {order.customer?.name || "Sem cliente"} · Qtd: {order.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Entrega</p>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                            {delivery.toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            isUrgent
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                          }`}
                        >
                          {diffDays === 0 ? "Hoje" : `${diffDays}d`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>{/* ══ FIM SEÇÃO ORDENS ══ */}

        {/* ══ SEÇÃO: ESTOQUE ══ */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <PackageOpen className="w-4 h-4" />
            Estoque de Materiais
          </h3>

          {lowStockItems.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 px-4 py-3">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Estoque de materiais sem alertas
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 px-4 py-2.5 border-b border-red-200 dark:border-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-sm font-bold text-red-700 dark:text-red-400">
                  {lowStockItems.length}{" "}
                  {lowStockItems.length === 1 ? "material abaixo" : "materiais abaixo"} do estoque mínimo
                </p>
              </div>
              <div className="h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 hover:bg-red-50/40 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </p>
                      {item.sku && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{item.sku}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Atual</p>
                        <p className="text-sm font-black text-red-600 dark:text-red-400">
                          {item.stock_quantity}{" "}
                          <span className="font-normal text-xs">{item.unit || "un"}</span>
                        </p>
                      </div>
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-600" />
                      <div className="text-right">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Mínimo</p>
                        <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                          {item.min_stock}{" "}
                          <span className="font-normal text-xs">{item.unit || "un"}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>{/* ══ FIM SEÇÃO ESTOQUE ══ */}

      </CardContent>
    </Card>
  );
}