"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Server, 
  Database, 
  Layers, 
  Radio, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Code2,
  Clock,
  Activity,
  Cpu
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ModeBadge from "@/components/shared/ModeBadge";
import { ServiceNode } from "@/types/telemetry";

const SERVICES_CATALOG = [
  {
    id: "backend",
    name: "backend",
    displayName: "Backend Core Service",
    type: "backend",
    lang: "Go 1.18",
    port: 4000,
    protocols: ["HTTP/REST", "MongoDB Wire", "Redis TCP"],
    otelSdk: "go.opentelemetry.io/otel v1.3.0",
    description: "Primary user signup & authentication gateway. Connects to Mongo for user persistence, Redis for session tokens, and emits OTLP traces to the Collector.",
    endpoints: ["POST /signup", "GET /health"],
    upstream: ["loadgen / Client"],
    downstream: ["mongo", "redis", "mail-service"],
  },
  {
    id: "mail-service",
    name: "mail-service",
    displayName: "Mail Dispatcher Service",
    type: "backend",
    lang: "Node.js 16 (Express)",
    port: 4100,
    protocols: ["HTTP/REST", "gRPC (Client)"],
    otelSdk: "@opentelemetry/sdk-node v0.27.0",
    description: "Handles welcome email orchestration upon successful registration. Communicates with template-service over gRPC to render dynamic HTML emails.",
    endpoints: ["POST /send-welcome", "GET /health"],
    upstream: ["backend"],
    downstream: ["template-service"],
  },
  {
    id: "template-service",
    name: "template-service",
    displayName: "Template Render Service",
    type: "backend",
    lang: "Node.js 16 (@grpc/grpc-js)",
    port: 4200,
    protocols: ["gRPC (Server)"],
    otelSdk: "@opentelemetry/instrumentation-grpc",
    description: "High-performance gRPC microservice providing template compilation and rendering for transactional communications.",
    endpoints: ["rpc RenderTemplate(TemplateRequest)"],
    upstream: ["mail-service"],
    downstream: [],
  },
  {
    id: "redis",
    name: "redis",
    displayName: "Redis In-Memory Cache",
    type: "cache",
    lang: "Redis 6.2-alpine",
    port: 6379,
    protocols: ["Redis Serialization Protocol (RESP)"],
    otelSdk: "Database Span Instrumentation",
    description: "Caching layer for user sessions, signup idempotency tokens, and rate-limiting keys.",
    endpoints: ["SET token:*", "GET token:*"],
    upstream: ["backend"],
    downstream: [],
  },
  {
    id: "mongo",
    name: "mongo",
    displayName: "MongoDB Document Database",
    type: "database",
    lang: "MongoDB 4.4",
    port: 27017,
    protocols: ["Mongo Wire Protocol"],
    otelSdk: "Database Span Instrumentation",
    description: "Persistent storage for user records, profile accounts, and registration audit trails.",
    endpoints: ["db.users.insertOne()", "db.users.findOne()"],
    upstream: ["backend"],
    downstream: [],
  },
  {
    id: "otel-collector",
    name: "otel-collector",
    displayName: "OpenTelemetry Collector",
    type: "collector",
    lang: "OTel Collector Contrib 0.43.0",
    port: 4317,
    protocols: ["OTLP/gRPC (4317)", "OTLP/HTTP (4318)", "Prometheus (8888)"],
    otelSdk: "OpenTelemetry Core Daemon",
    description: "High-throughput telemetry pipeline that ingests traces, metrics, and logs, processes batches, and exports to Tempo & Dynatrace SaaS.",
    endpoints: ["gRPC :4317", "HTTP :4318", "Prometheus :8888/metrics"],
    upstream: ["backend", "mail-service", "template-service"],
    downstream: ["tempo", "Dynatrace SaaS"],
  },
];

export default function ServicesPage() {
  const [topologyNodes, setTopologyNodes] = useState<ServiceNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/telemetry/topology")
      .then((res) => res.json())
      .then((data) => {
        if (data.nodes) setTopologyNodes(data.nodes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getNodeTelemetry = (id: string) => {
    return topologyNodes.find((n) => n.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Inventory</span>
            <ModeBadge mode="LOCAL" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-emerald-400" />
            Microservices Catalog & Health
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Overview of all instrumented services, ports, runtime stacks, and live telemetry health metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/topology"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            View Full Topology Map
          </Link>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SERVICES_CATALOG.map((svc) => {
          const telem = getNodeTelemetry(svc.id);
          const status = telem?.status || "healthy";

          return (
            <div
              key={svc.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all group hover:-translate-y-0.5"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-blue-400 group-hover:text-blue-300 transition-colors">
                      {svc.type === "database" ? (
                        <Database className="w-5 h-5 text-emerald-400" />
                      ) : svc.type === "cache" ? (
                        <Layers className="w-5 h-5 text-red-400" />
                      ) : svc.type === "collector" ? (
                        <Radio className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <Server className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">{svc.displayName}</h3>
                      <p className="text-[11px] font-mono text-slate-400">:{svc.port} • {svc.lang}</p>
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 my-3 leading-relaxed">
                  {svc.description}
                </p>

                {/* Telemetry Metrics Pill Bar */}
                <div className="grid grid-cols-3 gap-2 my-3 text-center">
                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Avg Latency</span>
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {telem?.latency ? `${telem.latency.toFixed(1)}ms` : "12.0ms"}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Error Rate</span>
                    <span className={`font-mono text-xs font-bold ${
                      (telem?.errorRate || 0) > 0 ? "text-red-400" : "text-emerald-400"
                    }`}>
                      {(telem?.errorRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Throughput</span>
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {telem?.rpm || 45} rpm
                    </span>
                  </div>
                </div>

                {/* Technical Specs List */}
                <div className="space-y-1.5 text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <span>Instrumentation:</span>
                    <span className="font-mono text-[10px] text-blue-300 truncate max-w-[170px]" title={svc.otelSdk}>
                      {svc.otelSdk}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Protocols:</span>
                    <span className="font-mono text-[10px] text-slate-300">
                      {svc.protocols.join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href={`/logs?service=${svc.name}`}
                  className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  View Logs
                </Link>
                <Link
                  href={`/services/${svc.id}`}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  Service Deep Dive <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
