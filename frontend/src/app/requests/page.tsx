"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRightLeft, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  RotateCw,
  GitCommit
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ModeBadge from "@/components/shared/ModeBadge";
import { TraceSummary } from "@/types/telemetry";

interface RequestItem {
  id: string;
  traceId: string;
  timestamp: string;
  method: string;
  path: string;
  service: string;
  durationMs: number;
  statusCode: number;
  statusText: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/telemetry/traces?limit=30");
      const data = await res.json();
      if (data.traces) {
        // Map trace summaries into request items
        const items: RequestItem[] = (data.traces as TraceSummary[]).map((t, idx) => {
          const isErr = Boolean(t.hasErrors || t.statusCode === "ERROR");
          const rootOp = t.rootOperation || t.rootOperationName || "";
          const isSignup = rootOp.toLowerCase().includes("signup");
          const isMail = rootOp.toLowerCase().includes("mail");
          const isTemplate = rootOp.toLowerCase().includes("template");
          const traceId = t.id || t.traceId || `trace-${idx}`;
          const timestamp = t.timestamp || t.startTime || new Date().toISOString();
          const durationMs = t.duration ?? t.durationMs ?? 0;

          let path = "/signup";
          let method = "POST";
          let service = "backend";
          let statusCode = isErr ? 500 : 201;

          if (isMail) {
            path = "/send-welcome";
            method = "POST";
            service = "mail-service";
            statusCode = isErr ? 503 : 200;
          } else if (isTemplate) {
            path = "RenderTemplate";
            method = "gRPC";
            service = "template-service";
            statusCode = isErr ? 14 : 0;
          }

          return {
            id: `req-${traceId.substring(0, 8)}-${idx}`,
            traceId,
            timestamp,
            method,
            path,
            service,
            durationMs,
            statusCode,
            statusText: statusCode === 201 ? "Created" : statusCode === 200 ? "OK" : statusCode === 0 ? "OK (gRPC)" : "Internal Error",
          };
        });
        setRequests(items);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 8000);
    return () => clearInterval(interval);
  }, []);

  const filteredRequests = requests.filter((r) => {
    if (serviceFilter !== "all" && r.service !== serviceFilter) return false;
    if (statusFilter === "success" && r.statusCode >= 400) return false;
    if (statusFilter === "error" && r.statusCode < 400) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.path.toLowerCase().includes(q) ||
        r.service.toLowerCase().includes(q) ||
        r.traceId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Transactions</span>
            <ModeBadge mode="LOCAL" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-cyan-400" />
            Live Requests Explorer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time HTTP and gRPC operations with correlated Distributed Trace IDs and latency measurements.
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          Refresh Requests
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search path, service, or Trace ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            Service:
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
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
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success (2xx / 0)</option>
              <option value="error">Errors (4xx / 5xx)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="p-3">Status</th>
                <th className="p-3">Method</th>
                <th className="p-3">Operation / Path</th>
                <th className="p-3">Service</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Trace Correlation</th>
                <th className="p-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    No matching requests found. Click "Run Transaction" in the header to generate live requests.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isErr = req.statusCode >= 400 || req.statusCode === 14;
                  return (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isErr
                              ? "bg-red-950/80 text-red-400 border-red-800"
                              : "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                          }`}
                        >
                          {req.statusCode} {req.statusText}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-blue-400">{req.method}</td>
                      <td className="p-3 text-slate-200 font-semibold">{req.path}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                          {req.service}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold ${
                            req.durationMs > 100
                              ? "text-red-400"
                              : req.durationMs > 40
                              ? "text-amber-400"
                              : "text-slate-200"
                          }`}
                        >
                          {req.durationMs.toFixed(1)} ms
                        </span>
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/traces/${req.traceId}`}
                          className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                        >
                          <GitCommit className="w-3 h-3" />
                          <span>{req.traceId.substring(0, 14)}...</span>
                        </Link>
                      </td>
                      <td className="p-3 text-right text-slate-500 text-[11px]">
                        {new Date(req.timestamp).toLocaleTimeString()}
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
