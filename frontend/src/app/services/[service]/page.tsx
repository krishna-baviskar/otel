"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  Server, 
  ArrowLeft, 
  Clock, 
  Layers, 
  Radio, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Code2,
  FileText,
  Activity,
  GitCommit
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ModeBadge from "@/components/shared/ModeBadge";
import { TraceSummary, LogEntry } from "@/types/telemetry";

const SERVICE_META: Record<string, {
  name: string;
  type: string;
  lang: string;
  port: number;
  description: string;
  otelDetails: string;
  endpoints: { method: string; path: string; latency: string; status: string }[];
  dependencies: { upstream: string[]; downstream: string[] };
}> = {
  backend: {
    name: "backend",
    type: "HTTP API Gateway & Core Logic",
    lang: "Go 1.18 (Gin / net/http)",
    port: 4000,
    description: "Core signup gateway receiving client HTTP registration requests. Orchestrates user storage in MongoDB, session key generation in Redis, and initiates welcome email events.",
    otelDetails: "Instrumented with Go OpenTelemetry SDK (go.opentelemetry.io/otel). Exports OTLP spans over gRPC to otel-collector:4317. Injects W3C TraceContext headers into downstream HTTP and database calls.",
    endpoints: [
      { method: "POST", path: "/signup", latency: "24.5ms", status: "201 Created" },
      { method: "GET", path: "/health", latency: "1.2ms", status: "200 OK" },
    ],
    dependencies: {
      upstream: ["loadgen / External Clients"],
      downstream: ["mongo (27017)", "redis (6379)", "mail-service (4100)"],
    },
  },
  "mail-service": {
    name: "mail-service",
    type: "Notification Dispatcher",
    lang: "Node.js 16 (Express)",
    port: 4100,
    description: "Asynchronous notification service that consumes signup events and triggers dynamic HTML email generation via gRPC template-service.",
    otelDetails: "Instrumented with @opentelemetry/sdk-node. Automatically extracts W3C traceparent from incoming Express requests and propagates metadata across gRPC call.",
    endpoints: [
      { method: "POST", path: "/send-welcome", latency: "38.2ms", status: "200 OK" },
      { method: "GET", path: "/health", latency: "1.5ms", status: "200 OK" },
    ],
    dependencies: {
      upstream: ["backend (4000)"],
      downstream: ["template-service (4200 - gRPC)"],
    },
  },
  "template-service": {
    name: "template-service",
    type: "Template Render Engine",
    lang: "Node.js 16 (@grpc/grpc-js)",
    port: 4200,
    description: "High-throughput gRPC template rendering service that compiles dynamic HTML payloads with user placeholders.",
    otelDetails: "Instrumented with @opentelemetry/instrumentation-grpc. Intercepts incoming unary gRPC calls, creates spans, and measures rendering computation duration.",
    endpoints: [
      { method: "gRPC", path: "template.TemplateService/RenderTemplate", latency: "14.1ms", status: "OK (0)" },
    ],
    dependencies: {
      upstream: ["mail-service (4100)"],
      downstream: [],
    },
  },
  redis: {
    name: "redis",
    type: "In-Memory Session & Cache",
    lang: "Redis 6.2-alpine",
    port: 6379,
    description: "Ultra-low latency in-memory data store for idempotency tokens, cached customer profiles, and session keys.",
    otelDetails: "Tracked via Go Redis client span hooks with span kind db.system: redis.",
    endpoints: [
      { method: "TCP", path: "SET user:session:*", latency: "0.8ms", status: "OK" },
      { method: "TCP", path: "GET user:session:*", latency: "0.6ms", status: "OK" },
    ],
    dependencies: {
      upstream: ["backend (4000)"],
      downstream: [],
    },
  },
  mongo: {
    name: "mongo",
    type: "Document Database",
    lang: "MongoDB 4.4",
    port: 27017,
    description: "Primary transactional data store persisting user accounts, hashed credentials, and account metadata.",
    otelDetails: "Tracked via Go mongo-driver OpenTelemetry command monitor creating db.statement spans.",
    endpoints: [
      { method: "TCP", path: "users.insertOne()", latency: "6.4ms", status: "Acknowledged" },
      { method: "TCP", path: "users.findOne()", latency: "3.2ms", status: "OK" },
    ],
    dependencies: {
      upstream: ["backend (4000)"],
      downstream: [],
    },
  },
  "otel-collector": {
    name: "otel-collector",
    type: "Observability Ingestion Gateway",
    lang: "OTel Collector Contrib 0.43.0",
    port: 4317,
    description: "High performance telemetry router that receives OTLP traces & metrics from all services, batches them, and exports to Tempo and Dynatrace.",
    otelDetails: "Configured via services/otel/config-dev.yaml. Exposes Prometheus scraping metrics at :8888/metrics.",
    endpoints: [
      { method: "gRPC", path: "otlp.v1.TraceService/Export", latency: "0.5ms", status: "OK" },
      { method: "HTTP", path: "/metrics", latency: "1.1ms", status: "200 OK" },
    ],
    dependencies: {
      upstream: ["backend", "mail-service", "template-service"],
      downstream: ["tempo (3200)", "Dynatrace SaaS API"],
    },
  },
};

export default function ServiceDetailPage() {
  const params = useParams();
  const serviceKey = (params?.service as string) || "backend";
  const meta = SERVICE_META[serviceKey] || {
    name: serviceKey,
    type: "Microservice",
    lang: "Containerized",
    port: 8080,
    description: `Service ${serviceKey} running inside Docker Compose cluster.`,
    otelDetails: "OpenTelemetry OTLP instrumentation enabled.",
    endpoints: [{ method: "GET", path: "/health", latency: "1.0ms", status: "200 OK" }],
    dependencies: { upstream: [], downstream: [] },
  };

  const [traces, setTraces] = useState<TraceSummary[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/telemetry/traces?service=${serviceKey}&limit=5`).then((r) => r.json()),
      fetch(`/api/telemetry/logs?service=${serviceKey}&limit=6`).then((r) => r.json()),
    ])
      .then(([tData, lData]) => {
        if (tData.traces) setTraces(tData.traces);
        if (lData.logs) setLogs(lData.logs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [serviceKey]);

  return (
    <div className="space-y-6">
      {/* Back button & Service Header */}
      <div>
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Services Directory
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-blue-400">
              <Server className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{meta.name}</h1>
                <StatusBadge status="healthy" />
                <ModeBadge mode="LOCAL" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {meta.type} • Port :{meta.port} • {meta.lang}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/logs?service=${meta.name}`}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Filtered Logs
            </Link>
            <Link
              href={`/traces?service=${meta.name}`}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <GitCommit className="w-3.5 h-3.5" />
              Filtered Traces
            </Link>
          </div>
        </div>
      </div>

      {/* Description & OpenTelemetry Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Service Architecture & Role
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {meta.description}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Upstream Callers</span>
              <div className="space-y-1">
                {meta.dependencies.upstream.length > 0 ? (
                  meta.dependencies.upstream.map((u) => (
                    <span key={u} className="inline-block px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                      {u}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[11px]">None (Entrypoint)</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Downstream Dependencies</span>
              <div className="space-y-1">
                {meta.dependencies.downstream.length > 0 ? (
                  meta.dependencies.downstream.map((d) => (
                    <span key={d} className="inline-block px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                      {d}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[11px]">None (Leaf Service)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-cyan-400" />
            OpenTelemetry Instrumentation Pipeline
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {meta.otelDetails}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Exporter Target:</span>
              <span className="text-cyan-400">otel-collector:4317</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Propagator:</span>
              <span className="text-slate-300">W3C TraceContext</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sampling Ratio:</span>
              <span className="text-emerald-400">100% (AlwaysOn)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoints & Methods Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Exposed Operations & Endpoints
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="p-3">Protocol / Method</th>
                <th className="p-3">Path / RPC Method</th>
                <th className="p-3">Typical Latency</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {meta.endpoints.map((ep, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-400">{ep.method}</td>
                  <td className="p-3 font-mono text-slate-200">{ep.path}</td>
                  <td className="p-3 font-mono text-slate-300">{ep.latency}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {ep.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Traces & Logs Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Traces */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <GitCommit className="w-4 h-4 text-cyan-400" />
            Recent Traces Involving {meta.name}
          </h3>
          <div className="space-y-2">
            {traces.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent traces found.</p>
            ) : (
              traces.map((t, idx) => {
                const traceId = t.id || t.traceId || `trace-${idx}`;
                const rootOp = t.rootOperation || t.rootOperationName || "POST /signup";
                const dur = t.duration ?? t.durationMs ?? 0;

                return (
                  <Link
                    key={traceId}
                    href={`/traces/${traceId}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-800/50 border border-slate-800 text-xs transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 block">{rootOp}</span>
                      <span className="font-mono text-[10px] text-blue-400">{traceId.substring(0, 16)}...</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs text-slate-200 block">{dur.toFixed(1)}ms</span>
                      <span className="text-[10px] text-slate-500">{t.spanCount} spans</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Correlated Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-400" />
            Recent Logs from {meta.name}
          </h3>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent logs recorded.</p>
            ) : (
              logs.map((l) => (
                <div
                  key={l.id}
                  className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      l.level === "ERROR" ? "bg-red-950 text-red-400" : "bg-blue-950 text-blue-400"
                    }`}>
                      {l.level}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(l.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 truncate">{l.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
