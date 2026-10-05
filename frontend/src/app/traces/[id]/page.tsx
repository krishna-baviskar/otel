"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, GitCommit, RotateCw, AlertCircle } from "lucide-react";
import TraceWaterfall from "@/components/traces/TraceWaterfall";
import { TraceDetail } from "@/types/telemetry";

export default function TraceDetailPage() {
  const params = useParams();
  const traceId = (params?.id as string) || "";
  const [trace, setTrace] = useState<TraceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrace = async () => {
    if (!traceId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/telemetry/traces/${traceId}`);
      if (!res.ok) {
        throw new Error(`Trace not found (HTTP ${res.status})`);
      }
      const data = await res.json();
      setTrace(data);
    } catch (err: any) {
      console.error("Failed to load trace detail:", err);
      setError(err.message || "Failed to load trace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrace();
  }, [traceId]);

  return (
    <div className="space-y-4">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/traces"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Traces List
        </Link>

        <button
          onClick={fetchTrace}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          Reload Trace
        </button>
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center shadow-lg">
          <RotateCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200">Retrieving Distributed Trace Spans</h3>
          <p className="text-xs text-slate-500 mt-1 font-mono">Trace ID: {traceId}</p>
        </div>
      ) : error || !trace ? (
        <div className="bg-slate-900 border border-red-900/60 rounded-xl p-10 text-center shadow-lg">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-red-200">Trace Not Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {error || "Could not retrieve span waterfall for the specified trace identifier."}
          </p>
          <Link
            href="/traces"
            className="mt-4 inline-block px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Return to Traces Explorer
          </Link>
        </div>
      ) : (
        <TraceWaterfall trace={trace} />
      )}
    </div>
  );
}
