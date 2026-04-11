"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap, Activity, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { getSignals, getSignalValues } from "@/lib/requestHandlers";
import { useLocale } from "next-intl";
import type { Device, Signal } from "@/types";

interface ChartPoint { time: string; value: number; }
interface EquipmentTabProps { devices: Device[]; }

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
}

function calcPower(a: number, v = 220) { return parseFloat((a * v).toFixed(1)); }

// ── Tooltip ───────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl
      bg-white border border-gray-200 text-gray-900
      dark:bg-gray-800/95 dark:border-gray-700/60 dark:text-gray-100"
      style={{ backdropFilter: "blur(8px)" }}>
      <p className="text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
      <p className="font-bold">{payload[0].value}{unit}</p>
    </div>
  );
}

// ── Device List ───────────────────────────────────────────────────────────────
function DeviceList({ devices, onSelect, isPT }: {
  devices: Device[]; onSelect: (d: Device) => void; isPT: boolean;
}) {
  const active = devices.filter((d) => d.is_active);
  const inactive = devices.filter((d) => !d.is_active);

  const Row = ({ device }: { device: Device }) => (
    <button
      onClick={() => onSelect(device)}
      className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left
        border transition-all duration-150
        bg-white border-gray-200 hover:border-gray-400 hover:shadow-md
        dark:bg-gray-800/50 dark:border-gray-700/50
        dark:hover:border-gray-500/70 dark:hover:bg-gray-800/80"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border
        ${device.is_active
          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50"
          : "bg-gray-50 border-gray-200 dark:bg-gray-700/40 dark:border-gray-600/50"}`}>
        {device.is_active
          ? <Wifi size={15} className="text-green-600 dark:text-green-500" />
          : <WifiOff size={15} className="text-gray-400 dark:text-gray-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">
          {device.name}
        </p>
        <p className="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
          {[device.device_type, device.location].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
      <span className="text-gray-300 dark:text-gray-600 text-lg font-light">›</span>
    </button>
  );

  const SLabel = ({ t }: { t: string }) => (
    <p className="text-xs font-semibold uppercase tracking-widest mb-2
      text-gray-400 dark:text-gray-500">{t}</p>
  );

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          {isPT ? "Equipamentos" : "Equipment"}
        </h2>
        <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
          {devices.length} {isPT ? "dispositivos cadastrados" : "registered devices"}
        </p>
      </div>
      {devices.length === 0 && (
        <p className="text-center py-12 text-sm text-gray-400 dark:text-gray-500">
          {isPT ? "Nenhum dispositivo cadastrado." : "No devices registered."}
        </p>
      )}
      {active.length > 0 && (
        <div className="mb-6">
          <SLabel t={`${isPT ? "Ativos" : "Active"} (${active.length})`} />
          <div className="flex flex-col gap-2">
            {active.map((d) => <Row key={d.id} device={d} />)}
          </div>
        </div>
      )}
      {inactive.length > 0 && (
        <div>
          <SLabel t={`${isPT ? "Inativos" : "Inactive"} (${inactive.length})`} />
          <div className="flex flex-col gap-2">
            {inactive.map((d) => <Row key={d.id} device={d} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Device Detail ─────────────────────────────────────────────────────────────
function DeviceDetail({ device, onBack, isPT }: {
  device: Device; onBack: () => void; isPT: boolean;
}) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [analogData, setAnalogData] = useState<ChartPoint[]>([]);
  const [digitalData, setDigitalData] = useState<ChartPoint[]>([]);
  const [latestCurrent, setLatestCurrent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sigs = await getSignals({ device_id: device.id.toString() });
      setSignals(sigs);
      const aS = sigs.filter((s) => s.signal_type === "analogic");
      const dS = sigs.filter((s) => s.signal_type === "digital");

      if (aS.length > 0) {
        const vals = await getSignalValues({ signal_id: aS[0].id.toString(), limit: "60" });
        const pts: ChartPoint[] = [...vals]
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .filter((v) => v.value != null)
          .map((v) => ({ time: fmtTime(v.timestamp), value: parseFloat((v.value as number).toFixed(3)) }));
        setAnalogData(pts);
        if (pts.length > 0) setLatestCurrent(pts[pts.length - 1].value);
      }
      if (dS.length > 0) {
        const vals = await getSignalValues({ signal_id: dS[0].id.toString(), limit: "60" });
        const pts: ChartPoint[] = [...vals]
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .filter((v) => v.digital_value != null)
          .map((v) => ({ time: fmtTime(v.timestamp), value: v.digital_value ? 1 : 0 }));
        setDigitalData(pts);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setLastRefresh(new Date()); }
  }, [device.id]);

  useEffect(() => { load(); const i = setInterval(load, 30_000); return () => clearInterval(i); }, [load]);

  const power = latestCurrent != null ? calcPower(latestCurrent) : null;
  const analogName = signals.find((s) => s.signal_type === "analogic")?.name;
  const digitalName = signals.find((s) => s.signal_type === "digital")?.name;

  // Shared card class
  const cardCls = "border-gray-200/70 dark:border-gray-700/50 dark:bg-gray-800/50";

  return (
    <div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              border transition-colors
              border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700
              dark:border-gray-700/60 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
          >
            <ArrowLeft size={13} />
            {isPT ? "Voltar" : "Back"}
          </button>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              {device.name}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {[device.device_type, device.location].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
        <button
          onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            border transition-colors disabled:opacity-50
            border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600
            dark:border-gray-700/60 dark:text-gray-500 dark:hover:border-gray-500 dark:hover:text-gray-300"
        >
          <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          {loading
            ? (isPT ? "Atualizando..." : "Updating...")
            : (isPT
                ? `Atualizado ${lastRefresh.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}`
                : `Updated ${lastRefresh.toLocaleTimeString()}`)}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[
          {
            label: isPT ? "Corrente Atual" : "Current",
            value: latestCurrent != null ? latestCurrent.toFixed(2) : null,
            unit: "A",
            sub: isPT ? "último valor recebido" : "last received value",
            icon: <Activity size={14} className="text-gray-400 dark:text-gray-500" />,
          },
          {
            label: isPT ? "Potência" : "Power",
            value: power != null ? (power >= 1000 ? (power/1000).toFixed(2) : power.toFixed(1)) : null,
            unit: power != null && power >= 1000 ? "kW" : "W",
            sub: "I × 220V",
            icon: <Zap size={14} className="text-gray-400 dark:text-gray-500" />,
          },
        ].map((kpi) => (
          <Card key={kpi.label} className={cardCls}>
            <CardContent className="pt-5 pb-5 px-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1
                    text-gray-400 dark:text-gray-500">
                    {kpi.label}
                  </p>
                  {kpi.value != null ? (
                    <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                      {kpi.value}
                      <span className="text-sm font-normal ml-1 text-gray-400 dark:text-gray-500">
                        {kpi.unit}
                      </span>
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-300 dark:text-gray-600">—</p>
                  )}
                  <p className="text-xs mt-1.5 text-gray-300 dark:text-gray-600">{kpi.sub}</p>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center
                  bg-gray-50 border border-gray-200
                  dark:bg-gray-700/50 dark:border-gray-600/50">
                  {kpi.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analog chart */}
      <Card className={`mb-3 ${cardCls}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {isPT ? "Corrente ao longo do tempo (A)" : "Current over time (A)"}
            {analogName && <span className="font-normal text-gray-400 dark:text-gray-500"> — {analogName}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          {analogData.length === 0 && !loading ? (
            <p className="text-center py-8 text-sm text-gray-300 dark:text-gray-600">
              {isPT ? "Sem dados analógicos." : "No analog data."}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analogData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-gray-100 dark:text-gray-700/50" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} className="fill-gray-300 dark:fill-gray-600" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} className="fill-gray-300 dark:fill-gray-600" tickLine={false} axisLine={false} domain={["auto","auto"]} />
                <Tooltip content={<ChartTooltip unit=" A" />} cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Line type="monotone" dataKey="value" stroke="#64748b" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#64748b", strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Digital chart */}
      <Card className={cardCls}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {isPT ? "Sinal digital ao longo do tempo" : "Digital signal over time"}
            {digitalName && <span className="font-normal text-gray-400 dark:text-gray-500"> — {digitalName}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          {digitalData.length === 0 && !loading ? (
            <p className="text-center py-8 text-sm text-gray-300 dark:text-gray-600">
              {isPT ? "Sem dados digitais." : "No digital data."}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={digitalData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-gray-100 dark:text-gray-700/50" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} className="fill-gray-300 dark:fill-gray-600" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} className="fill-gray-300 dark:fill-gray-600" tickLine={false} axisLine={false} domain={[-0.1,1.1]} ticks={[0,1]} tickFormatter={(v) => v === 1 ? "ON" : v === 0 ? "OFF" : ""} />
                <Tooltip content={<ChartTooltip unit="" />} cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <ReferenceLine y={0.5} stroke="#94a3b8" strokeDasharray="4 4" strokeOpacity={0.3} />
                <Line type="stepAfter" dataKey="value" stroke="#94a3b8" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#94a3b8", strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/40">
            {[["ON","1"],["OFF","0"]].map(([k,v]) => (
              <p key={k} className="text-xs text-gray-300 dark:text-gray-600">
                <strong className="text-gray-400 dark:text-gray-500">{k}</strong> = {v}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EquipmentTab({ devices }: EquipmentTabProps) {
  const locale = useLocale();
  const isPT = locale === "pt-BR";
  const [selected, setSelected] = useState<Device | null>(null);

  return (
    <div className="max-w-3xl">
      {selected
        ? <DeviceDetail device={selected} onBack={() => setSelected(null)} isPT={isPT} />
        : <DeviceList devices={devices} onSelect={setSelected} isPT={isPT} />
      }
    </div>
  );
}