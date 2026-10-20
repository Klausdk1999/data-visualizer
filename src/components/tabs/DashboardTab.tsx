"use client";

import React, { useState } from "react";
import { AlertTriangle, CalendarClock, PackageOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProductionOrder, TimeEntry, RawMaterial, Signal } from "@/types";

interface DashboardTabProps {
  signals: Signal[];
  orders: ProductionOrder[];
  timeEntries: TimeEntry[];
  rawMaterials: RawMaterial[];
  userId: number;
}

export default function DashboardTab({
  orders,
  timeEntries,
  rawMaterials = [],
  signals,
  userId,
}: DashboardTabProps) {
  const t = useTranslations("dashboardTab");
  const [dayFilter, setDayFilter] = useState<7 | 15 | 30>(30);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── KPIs filtered by period ──
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

  // ── Low stock ──
  const lowStockItems = rawMaterials.filter(
    (m) => m.min_stock !== undefined && m.min_stock !== null && m.stock_quantity <= m.min_stock
  );

  // ── Overdue orders ──
  const overdueOrders = orders.filter((o) => {
    if (o.status === "completed" || o.status === "cancelled") return false;
    if (!o.planned_delivery_date) return false;
    return new Date(o.planned_delivery_date) < today;
  });

  // ── Upcoming deliveries (7 days) ──
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
        new Date(a.planned_delivery_date!).getTime() - new Date(b.planned_delivery_date!).getTime()
    );

  // KPI card configs — use CSS variable keys
  const kpiCards = [
    {
      label: t("totalOrders"),
      value: totalOrdens,
      suffix: "",
      iconBgVar: "--icon-indigo-bg",
      iconColorVar: "--icon-indigo-color",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="9" x2="9" y2="21" />
        </svg>
      ),
    },
    {
      label: t("inProgress"),
      value: emAndamento,
      suffix: "",
      iconBgVar: "--icon-amber-bg",
      iconColorVar: "--icon-amber-color",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      ),
    },
    {
      label: t("completed"),
      value: concluidas,
      suffix: "",
      iconBgVar: "--icon-green-bg",
      iconColorVar: "--icon-green-color",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      label: t("totalHours"),
      value: totalHoras.toFixed(1),
      suffix: "h",
      iconBgVar: "--icon-violet-bg",
      iconColorVar: "--icon-violet-color",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* ══ Section Title ══ */}
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--text-muted)" }}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="9" x2="9" y2="21" />
        </svg>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("title")}
        </h2>
      </div>

      {/* ══ KPI Cards ══ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--surface-border)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            {/* Icon badge + label row */}
            <div className="flex items-start justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {card.label}
              </p>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `var(${card.iconBgVar})`,
                  color: `var(${card.iconColorVar})`,
                }}
              >
                {card.icon}
              </div>
            </div>
            {/* Value */}
            <p
              className="text-4xl font-black leading-none"
              style={{ color: "var(--text-primary)" }}
            >
              {card.value}
              {card.suffix && (
                <span className="text-xl font-bold ml-0.5" style={{ color: "var(--text-muted)" }}>
                  {card.suffix}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* ══ Overdue Alert ══ */}
      {overdueOrders.length > 0 && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            backgroundColor: "var(--overdue-bg)",
            border: "1px solid var(--overdue-border)",
          }}
        >
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "var(--overdue-icon)" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--overdue-text)" }}>
              {t(overdueOrders.length === 1 ? "overdueOrderOne" : "overdueOrderMany", {
                count: overdueOrders.length,
              })}
            </p>
            <p className="text-xs" style={{ color: "var(--overdue-sub)" }}>
              {overdueOrders.map((o) => o.product?.name || `#${o.id}`).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* ══ Bottom grid: Deliveries + Stock ══ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        {/* ── Próximas Entregas ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--surface-border)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="flex items-center gap-2 px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--surface-divider)" }}
          >
            <CalendarClock className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              {t("upcomingDeliveries")}
            </p>
          </div>

          {upcomingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 px-6">
              {/* Dashed box icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  border: "2px dashed var(--empty-box-border)",
                  backgroundColor: "var(--empty-box-bg)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--text-muted)" }}
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <line x1="10" y1="14" x2="14" y2="14" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  {t("noUpcomingDeliveries")}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {t("scheduleIsFree")}
                </p>
              </div>
              <button
                className="mt-1 px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  border: "1px solid var(--surface-border)",
                  color: "var(--text-secondary)",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--surface-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                {t("addEvent")}
              </button>
            </div>
          ) : (
            <div
              className="divide-y scrollbar-thin max-h-64 overflow-y-auto"
              style={{ borderColor: "var(--surface-divider)" }}
            >
              {upcomingOrders.map((order) => {
                const delivery = new Date(order.planned_delivery_date!);
                const diffDays = Math.ceil(
                  (delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = diffDays <= 2;
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between px-5 py-3 transition-colors"
                    style={{ borderColor: "var(--surface-divider)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor =
                        "var(--surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                    }}
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {order.product?.name || `${t("order")} #${order.id}`}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {order.customer?.name || t("noCustomer")} · {t("qty")}: {order.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {t("delivery")}
                        </p>
                        <p
                          className="text-xs font-semibold"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {delivery.toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={
                          isUrgent
                            ? {
                                backgroundColor: "var(--badge-urgent-bg)",
                                color: "var(--badge-urgent-color)",
                              }
                            : {
                                backgroundColor: "var(--badge-warning-bg)",
                                color: "var(--badge-warning-color)",
                              }
                        }
                      >
                        {diffDays === 0 ? t("today") : `${diffDays}d`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Estoque de Materiais ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--surface-border)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="flex items-center gap-2 px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--surface-divider)" }}
          >
            <PackageOpen className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              {t("materialStock")}
            </p>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-5">
              {/* Box icon with green checkmark */}
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "var(--stock-safe-box-bg)" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "var(--green-accent)",
                    border: "2px solid var(--surface)",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                style={{
                  backgroundColor: "var(--badge-success-bg)",
                  color: "var(--badge-success-color)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ backgroundColor: "var(--green-accent)" }}
                />
                {t("stockNoAlerts")}
              </span>
              <p
                className="text-xs text-center leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {t("stockSafeMessage")}
              </p>
              <button
                className="text-xs font-semibold mt-1 transition-opacity hover:opacity-70"
                style={{ color: "var(--indigo-accent)" }}
              >
                {t("viewFullReport")}
              </button>
            </div>
          ) : (
            <div
              className="divide-y scrollbar-thin max-h-72 overflow-y-auto"
              style={{ borderColor: "var(--surface-divider)" }}
            >
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-3 transition-colors"
                  style={{ borderColor: "var(--surface-divider)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      "var(--badge-urgent-bg)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                  }}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.name}
                    </p>
                    {item.sku && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {item.sku}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {t("current")}
                      </p>
                      <p
                        className="text-sm font-black"
                        style={{ color: "var(--badge-urgent-color)" }}
                      >
                        {item.stock_quantity}{" "}
                        <span
                          className="font-normal text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.unit || "un"}
                        </span>
                      </p>
                    </div>
                    <div
                      className="w-px h-8"
                      style={{
                        backgroundColor: "var(--surface-divider)",
                      }}
                    />
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {t("minimum")}
                      </p>
                      <p className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
                        {item.min_stock}{" "}
                        <span
                          className="font-normal text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.unit || "un"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
