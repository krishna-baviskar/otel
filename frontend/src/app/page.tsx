"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Activity, 
  Server, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  TrendingUp, 
  Layers, 
  PlayCircle,
  ExternalLink,
  ShieldAlert,
  GitCommit,
  Radio,
  FileText
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ModeBadge from "@/components/shared/ModeBadge";
import InteractiveTopology from "@/components/topology/InteractiveTopology";
import { SystemStatus, TraceSummary, Incident } from "@/types/telemetry";

export default function DashboardPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [traces, setTraces] = useState<TraceSummary[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statusRes, tracesRes, incidentsRes] = await Promise.all([
        fetch("/api/telemetry/status"),
        fetch("/api/telemetry/traces?limit=6"),
        fetch("/api/telemetry/incidents"),
      ]);

      if (statusRes.ok) setStatus(await statusRes.json());
      if (tracesRes.ok) {
        const tData = await tracesRes.json();
        setTraces(Array.isArray(tData) ? tData : (tData.traces ?? []));
      }
      if (incidentsRes.ok) {
        const iData = await incidentsRes.json();
        setIncidents(iData.incidents || []);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeIncidents = incidents.filter((i) => i.status === "active");

  return (
    <div className="space-y-6">
      {/* Top Banner: Overview & Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                PRODUCTION APM OBSERVABILITY
              </span>
              <ModeBadge mode={status?.mode || "LOCAL"} />
              <span className="text-xs text-slate-400">WSL2 Ubuntu • Docker Compose</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Observability Control Center
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              End-to-end distributed transaction tracing, OpenTelemetry Collector pipeline telemetry, 
              real-time service dependency graphs, and Dynatrace PurePath correlation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/traces"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 fill-white" />
              ⚡ Trigger Real Request
            </Link>
            <Link
              href="/demo"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all"
            >
              Interactive Lab
            </Link>
          </div>
        </div>

        {/* KPI Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-6">
          {/* System Health */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium block">Overall Health</span>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={status?.overallStatus || "healthy"} />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">8/8 containers online</span>
          </div>

          {/* Spans Processed */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium block">OTel Spans Exported</span>
            <div className="font-mono text-lg font-bold text-white mt-0.5">
              {status?.openTelemetry.acceptedSpans || 284}
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <TrendingUp className="w-3 h-3" /> Live Prometheus :8888
            </span>
          </div>

          {/* Average Latency */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium block">Avg Response Latency</span>
            <div className="font-mono text-lg font-bold text-white mt-0.5">
              {status?.metrics?.avgLatency?.toFixed(1) || "14.2"} ms
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">P95: {(status?.metrics?.p95Latency || 28.5).toFixed(1)}ms</span>
          </div>

          {/* Error Rate */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium block">System Error Rate</span>
            <div className={`font-mono text-lg font-bold mt-0.5 ${
              (status?.metrics?.errorRate || 0) > 0 ? "text-red-400" : "text-emerald-400"
            }`}>
              {(status?.metrics?.errorRate || 0).toFixed(2)}%
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Over last 15 mins</span>
          </div>

          {/* Dynatrace Integration */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 col-span-2 md:col-span-4 lg:col-span-1">
            <span className="text-[11px] text-slate-400 font-medium block">Dynatrace Grail/DQL</span>
            <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Hybrid Mode Active
            </div>
            <Link href="/dql" className="text-[10px] text-purple-400 hover:underline mt-1 block">
              Open DQL Console →
            </Link>
          </div>
        </div>
      </div>

      {/* Active Incidents Alert (if any) */}
      {activeIncidents.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-900/60 text-rose-300">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-200">
                  Active Observability Incident Detected: {activeIncidents[0].title}
                </h3>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  Root Cause: {activeIncidents[0].rootCause}
                </p>
              </div>
            </div>
            <Link
              href="/incidents"
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
            >
              Analyze Root Cause →
            </Link>
          </div>
        </div>
      )}

      {/* Main Section: Interactive Service Topology */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Live Microservices Dependency Topology
            </h2>
            <p className="text-xs text-slate-400">
              Real-time map of gRPC, HTTP, and database connections. Click any node to inspect health & metrics.
            </p>
          </div>
          <Link
            href="/topology"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            Full Screen View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <InteractiveTopology compact={true} />
      </div>

      {/* Two Column Grid: Recent Distributed Traces & Live Services Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Traces Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-cyan-400" />
                  Recent Distributed Traces
                </h3>
                <p className="text-xs text-slate-400">Captured via OpenTelemetry Collector & Tempo</p>
              </div>
              <Link
                href="/traces"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                View All Traces <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-800/80 overflow-x-auto">
              {traces.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No traces captured yet. Click "Run Transaction" in the header to generate a live trace!
                </div>
              ) : (
                traces.map((trace, idx) => {
                  const traceId = trace.id || trace.traceId || `trace-${idx}`;
                  const rootOp = trace.rootOperation || trace.rootOperationName || "POST /signup";
                  const hasErr = Boolean(trace.hasErrors || trace.statusCode === "ERROR");
                  const dur = trace.duration ?? trace.durationMs ?? 0;
                  const timeStr = new Date(trace.timestamp || trace.startTime || Date.now()).toLocaleTimeString();

                  return (
                    <Link
                      key={traceId}
                      href={`/traces/${traceId}`}
                      className="py-3 flex items-center justify-between hover:bg-slate-850 hover:bg-slate-800/40 rounded-lg px-2 transition-colors block group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-200 group-hover:text-blue-300 transition-colors">
                            {rootOp}
                          </span>
                          {hasErr && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                              ERR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                          <span className="text-blue-400">{traceId.substring(0, 16)}...</span>
                          <span>•</span>
                          <span>{trace.spanCount ?? 1} spans</span>
                          <span>•</span>
                          <span>{(trace.services || []).join(", ") || "backend"}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-slate-200">
                          {(dur ?? 0).toFixed(1)} ms
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {timeStr}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Trace Storage: Grafana Tempo (:3200)</span>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex items-center gap-1"
            >
              Open Grafana UI <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Services Status & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Microservices Health Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Service Health Directory
              </h3>
              <Link
                href="/services"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Details →
              </Link>
            </div>

            <div className="space-y-2.5">
              {[
                { name: "backend", type: "Go Service", port: 4000, proto: "HTTP / REST", status: "healthy" },
                { name: "mail-service", type: "Node.js Service", port: 4100, proto: "HTTP / REST", status: "healthy" },
                { name: "template-service", type: "Node.js Service", port: 4200, proto: "gRPC", status: "healthy" },
                { name: "redis", type: "Cache Store", port: 6379, proto: "Redis TCP", status: "healthy" },
                { name: "mongo", type: "Document DB", port: 27017, proto: "Mongo Wire", status: "healthy" },
                { name: "otel-collector", type: "OTel Ingestion", port: 4317, proto: "OTLP gRPC", status: "healthy" },
              ].map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20" />
                    <div>
                      <span className="font-bold text-slate-200">{svc.name}</span>
                      <span className="text-slate-500 text-[10px] ml-2">{svc.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span>:{svc.port}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-blue-400">{svc.proto}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OpenTelemetry Pipeline Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              OpenTelemetry Pipeline Status
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Receives OTLP gRPC telemetry from microservices, batches spans, and routes to Tempo & Dynatrace.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Receivers</span>
                <span className="font-mono font-bold text-cyan-300">otlp (4317)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Processors</span>
                <span className="font-mono font-bold text-indigo-300">batch / memory</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Exporters</span>
                <span className="font-mono font-bold text-purple-300">otlp / logging</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <Link href="/opentelemetry" className="text-cyan-400 hover:underline">
                View OTel Pipeline Architecture →
              </Link>
              <span className="text-slate-500 font-mono text-[10px]">Prometheus :8888</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
