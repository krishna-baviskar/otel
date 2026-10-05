"use client";

import React, { useState, useEffect } from "react";
import { 
  LineChart as LineChartIcon, 
  Clock, 
  Activity, 
  TrendingUp, 
  Radio, 
  Cpu, 
  Layers, 
  RotateCw,
  Zap,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import ModeBadge from "@/components/shared/ModeBadge";

interface MetricPoint {
  timestamp: string;
  timeLabel: string;
  backendRpm: number;
  mailRpm: number;
  templateRpm: number;
  p50Latency: number;
  p90Latency: number;
  p99Latency: number;
  errorRate: number;
  otelSpansAccepted: number;
  cpuPercent: number;
  memPercent: number;
}

export default function MetricsPage() {
  const [timeRange, setTimeRange] = useState<"5m" | "15m" | "30m" | "1h" | "24h">("15m");
  const [data, setData] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const generateData = () => {
    const points: MetricPoint[] = [];
    const count = timeRange === "5m" ? 10 : timeRange === "15m" ? 18 : 24;
    const now = Date.now();
    const stepMs = (15 * 60 * 1000) / count;

    for (let i = count - 1; i >= 0; i--) {
      const t = new Date(now - i * stepMs);
      const timeLabel = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      // Controlled jitter
      const jitter = (Math.sin(i / 2) + 1) * 5;
      const spike = i === 4 ? 22 : 0;

      points.push({
        timestamp: t.toISOString(),
        timeLabel,
        backendRpm: Math.round(45 + jitter * 2 + (i % 3 === 0 ? 8 : 0)),
        mailRpm: Math.round(42 + jitter * 1.8),
        templateRpm: Math.round(42 + jitter * 1.8),
        p50Latency: +(12.4 + jitter * 0.8).toFixed(1),
        p90Latency: +(28.2 + jitter * 1.5 + spike * 1.2).toFixed(1),
        p99Latency: +(45.6 + jitter * 2.2 + spike * 3.5).toFixed(1),
        errorRate: +(spike > 0 ? 3.8 : 0.05 + (Math.random() * 0.1)).toFixed(2),
        otelSpansAccepted: Math.round(180 + jitter * 12 + i * 8),
        cpuPercent: Math.round(18 + jitter * 1.2),
        memPercent: Math.round(38 + jitter * 0.4),
      });
    }

    setData(points);
    setLoading(false);
  };

  useEffect(() => {
    generateData();
    if (!autoRefresh) return;
    const interval = setInterval(generateData, 8000);
    return () => clearInterval(interval);
  }, [timeRange, autoRefresh]);

  const latest = data[data.length - 1] || {
    p50Latency: 12.4,
    p95Latency: 28.2,
    errorRate: 0.0,
    otelSpansAccepted: 240,
    backendRpm: 50,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">APM Telemetry</span>
            <ModeBadge mode="LOCAL" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LineChartIcon className="w-6 h-6 text-cyan-400" />
            Real-Time Metrics & Performance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prometheus scraped metrics from OpenTelemetry Collector (:8888), microservices throughput, and latency percentiles.
          </p>
        </div>

        {/* Time range selector & refresh */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            {(["5m", "15m", "30m", "1h", "24h"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  timeRange === r
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              autoRefresh
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Live 8s" : "Paused"}
          </button>
        </div>
      </div>

      {/* Top Metric Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[11px] text-slate-400 block mb-1">Median Latency (P50)</span>
          <div className="font-mono text-xl font-bold text-white">
            {latest.p50Latency} ms
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">Optimal response time</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[11px] text-slate-400 block mb-1">Tail Latency (P99)</span>
          <div className="font-mono text-xl font-bold text-amber-400">
            {latest.p99Latency || 45.6} ms
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">99th percentile threshold</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[11px] text-slate-400 block mb-1">Error Rate</span>
          <div className={`font-mono text-xl font-bold ${
            latest.errorRate > 0 ? "text-red-400" : "text-emerald-400"
          }`}>
            {latest.errorRate}%
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">HTTP 5xx & gRPC non-zero</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[11px] text-slate-400 block mb-1">OTel Ingestion Rate</span>
          <div className="font-mono text-xl font-bold text-cyan-400">
            {latest.otelSpansAccepted} spans
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Prometheus :8888 metrics</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Request Rate (RPS/RPM) by Service */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Throughput by Microservice (RPM)
              </h3>
              <p className="text-xs text-slate-400">Requests per minute processed per container</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorBackend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="backendRpm"
                  name="backend (Go)"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorBackend)"
                />
                <Area
                  type="monotone"
                  dataKey="mailRpm"
                  name="mail-service"
                  stroke="#f59e0b"
                  fillOpacity={1}
                  fill="url(#colorMail)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Latency Percentiles (P50, P90, P99) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Latency Percentiles (ms)
              </h3>
              <p className="text-xs text-slate-400">Response time distribution across signup flow</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} unit="ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="p50Latency"
                  name="P50 (Median)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p90Latency"
                  name="P90"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p99Latency"
                  name="P99 (Tail)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Error Rate Percentage */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Error Rate Percentage (%)
              </h3>
              <p className="text-xs text-slate-400">Failed operations vs total transaction count</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorErr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="errorRate"
                  name="Error Rate %"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorErr)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: OpenTelemetry Collector Span Ingestion */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                OpenTelemetry Collector Ingestion Rate
              </h3>
              <p className="text-xs text-slate-400">Prometheus metric: otelcol_receiver_accepted_spans</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="otelSpansAccepted"
                  name="Spans Ingested"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
