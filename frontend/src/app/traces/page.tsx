"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  GitCommit, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  RotateCw,
  Layers,
  ArrowRight
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ModeBadge from "@/components/shared/ModeBadge";
import { TraceSummary } from "@/types/telemetry";

export default function TracesPage() {
  const [traces, setTraces] = useState<TraceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadTraces = async () => {
    try {
      setLoading(true);
      let url = "/api/telemetry/traces?limit=40";
      if (serviceFilter !== "all") url += `&service=${serviceFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.traces) setTraces(data.traces);
    } catch (err) {
      console.error("Failed to load traces:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTraces();
    const interval = setInterval(loadTraces, 8000);
    return () => clearInterval(interval);
  }, [serviceFilter]);

  const filteredTraces = traces.filter((t) => {
    const hasErr = Boolean(t.hasErrors || t.statusCode === "ERROR");
    if (statusFilter === "success" && hasErr) return false;
    if (statusFilter === "error" && !hasErr) return false;
    if (search) {
      const q = search.toLowerCase();
      const traceId = t.id || t.traceId || "";
      const rootOp = t.rootOperation || t.rootOperationName || "";
      return (
        traceId.toLowerCase().includes(q) ||
        rootOp.toLowerCase().includes(q) ||
        t.services.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const maxDuration = Math.max(...traces.map((t) => t.duration ?? t.durationMs ?? 1), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Distributed Tracing</span>
            <ModeBadge mode="LOCAL" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GitCommit className="w-6 h-6 text-indigo-400" />
            Distributed Traces Explorer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end W3C trace contexts collected via OpenTelemetry Collector and stored in Grafana Tempo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3000/explore"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Tempo Explorer (Grafana)
          </a>
          <button
            onClick={loadTraces}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Traces
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Trace ID or Root Operation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            Service:
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Services</option>
              <option value="backend">backend</option>
              <option value="mail-service">mail-service</option>
              <option value="template-service">template-service</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            Status:
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success Only</option>
              <option value="error">Errors Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Traces Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="p-3">Trace ID</th>
                <th className="p-3">Root Operation</th>
                <th className="p-3">Services Involved</th>
                <th className="p-3">Spans</th>
                <th className="p-3 w-48">Duration Breakdown</th>
                <th className="p-3 text-right">Time</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredTraces.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    No traces matching current criteria. Click "Run Transaction" in the header to generate live traces.
                  </td>
                </tr>
              ) : (
              filteredTraces.map((trace, idx) => {
                const traceId = trace.id || trace.traceId || `trace-${idx}`;
                const rootOp = trace.rootOperation || trace.rootOperationName || "POST /signup";
                const hasErr = Boolean(trace.hasErrors || trace.statusCode === "ERROR");
                const dur = trace.duration ?? trace.durationMs ?? 0;
                const timeStr = new Date(trace.timestamp || trace.startTime || Date.now()).toLocaleTimeString();
                const widthPercent = Math.max(5, Math.min(100, (dur / maxDuration) * 100));

                return (
                  <tr key={traceId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <Link
                        href={`/traces/${traceId}`}
                        className="text-cyan-400 hover:text-cyan-300 hover:underline font-bold"
                      >
                        {traceId.substring(0, 16)}...
                      </Link>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-100 font-semibold">{rootOp}</span>
                        {hasErr && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                            ERROR
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {trace.services.map((svc) => (
                          <span
                            key={svc}
                            className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">
                      <span className="font-bold text-white">{trace.spanCount}</span> spans
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${widthPercent}%`,
                              backgroundColor: hasErr ? "#ef4444" : "#6366f1",
                            }}
                          />
                        </div>
                        <span className="text-slate-200 font-bold min-w-[50px] text-right">
                          {dur.toFixed(1)}ms
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right text-slate-500 text-[11px]">
                      {timeStr}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/traces/${traceId}`}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
