"use client";

import React, { useState } from "react";
import Link from "next/link";
import ModeBadge from "@/components/shared/ModeBadge";
import { TransactionModal } from "@/components/demo/TransactionModal";
import { IncidentSimulatorModal } from "@/components/demo/IncidentSimulatorModal";
import { 
  FlaskConical, 
  PlayCircle, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  GitCommit, 
  LineChart, 
  FileText, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function DemoPage() {
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Interactive Lab</span>
            <ModeBadge mode="LOCAL" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-amber-400" />
            Observability Interactive Demo & Testing Lab
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Test distributed transactions, inject safe simulated outages, and observe telemetry propagation in real time.
          </p>
        </div>
      </div>

      {/* Main Interactive Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Live Transaction Runner */}
        <div className="bg-slate-900 border border-slate-800 hover:border-blue-700/60 rounded-xl p-6 shadow-xl flex flex-col justify-between transition-all">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400">
              <PlayCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              1. Execute Live Signup Transaction
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Fires a real HTTP request to the Go backend (<code>POST http://localhost:4000/signup</code>). 
              Watch the multi-step transaction create MongoDB records, store Redis tokens, dispatch mail notifications, 
              render gRPC templates, and export W3C trace contexts to Tempo.
            </p>
            <div className="space-y-1.5 text-xs text-slate-400 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 mb-4">
              <div>→ 1. Client HTTP POST :4000</div>
              <div>→ 2. MongoDB insertOne</div>
              <div>→ 3. Redis SET session token</div>
              <div>→ 4. HTTP POST mail-service :4100</div>
              <div>→ 5. gRPC template-service :4200</div>
              <div>→ 6. OTLP export to Collector :4317</div>
            </div>
          </div>

          <button
            onClick={() => setTransactionOpen(true)}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <PlayCircle className="w-4 h-4" />
            Open Transaction Runner Modal
          </button>
        </div>

        {/* Card 2: Incident Simulator */}
        <div className="bg-slate-900 border border-slate-800 hover:border-rose-700/60 rounded-xl p-6 shadow-xl flex flex-col justify-between transition-all">
          <div>
            <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              2. Inject Controlled Outages & Chaos
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Simulate enterprise failure scenarios in a safe, reversible sandbox. 
              Observe how the service dependency graph turns degraded, error rates elevate in metrics charts, 
              and Davis AI isolates the causal root cause.
            </p>
            <div className="space-y-1.5 text-xs text-slate-400 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 mb-4">
              <div className="text-amber-400">• Redis Cache Slowdown (2000ms latency)</div>
              <div className="text-rose-400">• Mail Service Connection Drop (503 Error)</div>
              <div className="text-purple-400">• OpenTelemetry Collector Buffer Spike</div>
            </div>
          </div>

          <button
            onClick={() => setIncidentOpen(true)}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            Open Incident Simulator Modal
          </button>
        </div>
      </div>

      {/* Observability Telemetry Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
          Telemetry Observation Checklist
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <Link
            href="/traces"
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors group block"
          >
            <div className="flex items-center gap-2 font-bold text-white group-hover:text-blue-300 mb-1">
              <GitCommit className="w-4 h-4 text-cyan-400" />
              1. Distributed Traces
            </div>
            <p className="text-[11px] text-slate-400">
              Inspect waterfall flame graphs and span execution timings.
            </p>
          </Link>

          <Link
            href="/metrics"
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors group block"
          >
            <div className="flex items-center gap-2 font-bold text-white group-hover:text-blue-300 mb-1">
              <LineChart className="w-4 h-4 text-emerald-400" />
              2. APM Metrics
            </div>
            <p className="text-[11px] text-slate-400">
              Watch P50/P99 latency curves and error rate percentage spikes.
            </p>
          </Link>

          <Link
            href="/logs"
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors group block"
          >
            <div className="flex items-center gap-2 font-bold text-white group-hover:text-blue-300 mb-1">
              <FileText className="w-4 h-4 text-blue-400" />
              3. Correlated Logs
            </div>
            <p className="text-[11px] text-slate-400">
              Trace-correlated log entries with stack traces and attributes.
            </p>
          </Link>

          <Link
            href="/incidents"
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors group block"
          >
            <div className="flex items-center gap-2 font-bold text-white group-hover:text-blue-300 mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              4. Davis® AI RCA
            </div>
            <p className="text-[11px] text-slate-400">
              Automated root-cause analysis isolating failing dependencies.
            </p>
          </Link>
        </div>
      </div>

      <TransactionModal isOpen={transactionOpen} onClose={() => setTransactionOpen(false)} />
      <IncidentSimulatorModal isOpen={incidentOpen} onClose={() => setIncidentOpen(false)} />
    </div>
  );
}
