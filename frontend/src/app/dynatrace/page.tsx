"use client";

import React, { useState } from "react";
import ModeBadge from "@/components/shared/ModeBadge";
import { 
  Flame, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Radio, 
  Key, 
  ShieldCheck, 
  RotateCw,
  Sparkles,
  BookOpen,
  ArrowRight
} from "lucide-react";

export default function DynatracePage() {
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details: string;
  } | null>(null);

  const testConnection = async () => {
    try {
      setTestingConnection(true);
      setTestResult(null);
      // Simulate live check against dynatrace endpoint
      await new Promise((r) => setTimeout(r, 1200));
      setTestResult({
        success: false,
        message: "Dynatrace credentials not configured in environment (Running in Demo/Local mode)",
        details: "To connect a live Dynatrace tenant, export DYNATRACE_URL and DYNATRACE_API_TOKEN in your environment or Docker Compose configuration.",
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "Connection failed",
        details: err.message,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Enterprise APM</span>
            <ModeBadge mode="DEMO" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-purple-400" />
            Dynatrace Hybrid Integration Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            PurePath® hybrid tracing, Grail™ data lakehouse ingestion, and Davis® AI causal dependency mapping.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://www.dynatrace.com/support/help/shortlink/opentags-traces"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            Dynatrace OTel Docs
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </div>

      {/* PurePath Architecture Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-blue-950/30 border border-purple-800/40 rounded-xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              PurePath® Hybrid OpenTelemetry Monitoring
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dynatrace ingests standard OpenTelemetry spans via OTLP and automatically stitches them into 
              PurePath distributed transactions. This provides code-level visibility, horizontal service 
              dependencies, and automated Davis AI root cause analysis without requiring vendor lock-in.
            </p>
          </div>

          <div className="flex flex-col gap-2 min-w-[200px]">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 block">Integration Mode</span>
              <span className="font-bold text-purple-300">OTel Collector Exporter</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 block">OTLP Endpoint</span>
              <span className="font-mono text-slate-300 text-[11px]">/api/v2/otlp/v1/traces</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connectivity Test Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-purple-400" />
          Tenant Connectivity Checker
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">DYNATRACE_URL</span>
            <span className="text-slate-300 truncate block mt-0.5">
              {process.env.DYNATRACE_URL || "https://{your-environment-id}.live.dynatrace.com (Not set)"}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">DYNATRACE_API_TOKEN</span>
            <span className="text-slate-300 truncate block mt-0.5">
              {process.env.DYNATRACE_API_TOKEN ? "dt0c01.********************" : "dt0c01. (Not set - Demo Fallback)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={testConnection}
            disabled={testingConnection}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${testingConnection ? "animate-spin" : ""}`} />
            {testingConnection ? "Validating Endpoint..." : "Test Tenant Connection"}
          </button>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-xl border text-xs ${
            testResult.success
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              : "bg-amber-950/40 border-amber-800 text-amber-300"
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {testResult.message}
            </div>
            <p className="text-slate-300 text-[11px] font-sans mt-1">
              {testResult.details}
            </p>
          </div>
        )}
      </div>

      {/* How to Connect Step-by-Step */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Step-by-Step Dynatrace Live Setup Guide
        </h3>

        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200 shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Generate Dynatrace Ingestion API Token</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                In Dynatrace, navigate to <strong>Settings → Access tokens</strong>, create a new token with the scope <code>openTelemetryTrace.ingest</code> (Ingest OpenTelemetry traces).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200 shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Configure Collector Exporter in docker-compose.yaml</h4>
              <p className="text-slate-400 text-[11px] mt-0.5 font-mono">
                Set environment variables <code>DYNATRACE_URL</code> and <code>DYNATRACE_API_TOKEN</code> on the <code>otel-collector</code> service container.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200 shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-slate-200">Restart Collector & Inspect in Dynatrace Distributed Traces</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Traces will instantly flow to Dynatrace Distributed Tracing, Smartscape, and Grail DQL queries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
