"use client";

import React, { useState } from "react";
import ModeBadge from "@/components/shared/ModeBadge";
import { 
  Radio, 
  Layers, 
  ArrowRight, 
  FileCode, 
  CheckCircle2, 
  Cpu, 
  Server, 
  Database,
  ExternalLink,
  Code2,
  Copy,
  Check
} from "lucide-react";

const COLLECTOR_CONFIG_YAML = `receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 256
  memory_limiter:
    check_interval: 1s
    limit_percentage: 75
    spike_limit_percentage: 20

exporters:
  otlp/tempo:
    endpoint: tempo:3200
    tls:
      insecure: true
  otlphttp/dynatrace:
    endpoint: \${DYNATRACE_URL}/api/v2/otlp
    headers:
      Authorization: "Api-Token \${DYNATRACE_API_TOKEN}"
  logging:
    loglevel: debug
  prometheus:
    endpoint: 0.0.0.0:8888

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp/tempo, logging]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus, logging]`;

export default function OpenTelemetryPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(COLLECTOR_CONFIG_YAML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Pipeline Engineering</span>
            <ModeBadge mode="LOCAL" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-cyan-400" />
            OpenTelemetry Collector Architecture & Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ingestion gateway, telemetry pipeline processing, and multi-destination exporter topology.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://localhost:8888/metrics"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            Live Prometheus :8888/metrics
          </a>
        </div>
      </div>

      {/* Visual Pipeline Flow Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Telemetry Ingestion & Routing Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1: SDK Sources */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs text-slate-200">1. Microservice SDKs</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Native instrumentation with context propagation.
              </p>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">
                  backend (Go OTel SDK)
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-amber-300">
                  mail-service (Node.js SDK)
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                  template-service (gRPC SDK)
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
              Protocol: OTLP / gRPC
            </div>
          </div>

          {/* Step 2: Collector Receivers */}
          <div className="bg-slate-950 p-4 rounded-xl border border-cyan-800/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs text-slate-200">2. Collector Receivers</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Listens on standard OpenTelemetry ports.
              </p>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-cyan-300 flex justify-between">
                  <span>otlp/grpc</span>
                  <span className="text-slate-500">:4317</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-cyan-300 flex justify-between">
                  <span>otlp/http</span>
                  <span className="text-slate-500">:4318</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Status: Listening
            </div>
          </div>

          {/* Step 3: Processors */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-xs text-slate-200">3. Pipeline Processors</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Batching and backpressure protection.
              </p>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-purple-300">
                  memory_limiter (75% limit)
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-purple-300">
                  batch (timeout 1s, size 256)
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
              In-Memory Buffer
            </div>
          </div>

          {/* Step 4: Exporters */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs text-slate-200">4. Target Exporters</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Dual dispatch to local storage and Dynatrace SaaS.
              </p>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-emerald-300 flex justify-between">
                  <span>Tempo</span>
                  <span className="text-slate-500">:3200</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-cyan-300 flex justify-between">
                  <span>Prometheus</span>
                  <span className="text-slate-500">:8888</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-purple-300 flex justify-between">
                  <span>Dynatrace</span>
                  <span className="text-slate-500">OTLP/HTTP</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
              Hybrid Ingestion
            </div>
          </div>
        </div>
      </div>

      {/* Collector YAML Config Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <FileCode className="w-4 h-4 text-cyan-400" />
            Active OpenTelemetry Collector Configuration (services/otel/config-dev.yaml)
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Copy Config YAML"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="p-4 bg-slate-950 overflow-x-auto max-h-96">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {COLLECTOR_CONFIG_YAML}
          </pre>
        </div>
      </div>
    </div>
  );
}
