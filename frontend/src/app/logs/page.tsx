"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  FileText, 
  Search, 
  Filter, 
  RotateCw, 
  GitCommit, 
  ChevronDown, 
  ChevronRight, 
  X,
  Code2,
  AlertTriangle,
  CheckCircle2,
  Terminal
} from "lucide-react";
import ModeBadge from "@/components/shared/ModeBadge";
import { LogEntry } from "@/types/telemetry";

function LogsContent() {
  const searchParams = useSearchParams();
  const initialTraceId = searchParams.get("traceId") || "";
  const initialService = searchParams.get("service") || "all";

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState(initialService);
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [activeTraceId, setActiveTraceId] = useState(initialTraceId);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = "/api/telemetry/logs?limit=50";
      if (selectedService !== "all") url += `&service=${selectedService}`;
      if (selectedLevel !== "all") url += `&level=${selectedLevel}`;
      if (activeTraceId) url += `&traceId=${activeTraceId}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedService, selectedLevel, activeTraceId]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.message.toLowerCase().includes(q) ||
      log.service.toLowerCase().includes(q) ||
      (log.traceId && log.traceId.toLowerCase().includes(q))
    );
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return "bg-red-950/80 text-red-400 border-red-800";
      case "WARN":
        return "bg-amber-950/80 text-amber-400 border-amber-800";
      case "DEBUG":
        return "bg-slate-800 text-slate-400 border-slate-700";
      default:
        return "bg-blue-950/80 text-blue-400 border-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Log Management</span>
            <ModeBadge mode="LOCAL" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            Correlated Logs & Trace Context
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Application logs correlated with W3C distributed trace identifiers for end-to-end debugging.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          Refresh Stream
        </button>
      </div>

      {/* Active Trace Filter Banner (if filtering by traceId) */}
      {activeTraceId && (
        <div className="bg-blue-950/40 border border-blue-800/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <GitCommit className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300">Filtering correlated logs for Trace ID:</span>
            <span className="font-mono font-bold text-blue-300">{activeTraceId}</span>
          </div>
          <button
            onClick={() => setActiveTraceId("")}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear Trace Filter
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search log messages, traces, or metadata..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            Service:
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Services</option>
              <option value="backend">backend</option>
              <option value="mail-service">mail-service</option>
              <option value="template-service">template-service</option>
              <option value="otel-collector">otel-collector</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            Level:
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Feed Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg font-mono text-xs">
        <div className="divide-y divide-slate-800/60">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No matching log records found. Try adjusting filters or click "Run Transaction" to emit logs.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;

              return (
                <div key={log.id} className="hover:bg-slate-850 hover:bg-slate-800/40 transition-colors">
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-3 flex items-start gap-3 cursor-pointer select-none"
                  >
                    <button className="text-slate-500 hover:text-slate-300 mt-0.5">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    <div className="text-[11px] text-slate-500 min-w-[70px] whitespace-nowrap mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border min-w-[54px] text-center ${getLevelBadge(log.level)}`}>
                      {log.level}
                    </span>

                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 min-w-[100px] text-center">
                      {log.service}
                    </span>

                    <div className="flex-1 text-slate-200 text-xs break-all">
                      {log.message}
                    </div>

                    {log.traceId && (
                      <Link
                        href={`/traces/${log.traceId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 text-[11px] whitespace-nowrap"
                        title="Jump to distributed trace"
                      >
                        <GitCommit className="w-3.5 h-3.5" />
                        <span>{log.traceId.substring(0, 10)}...</span>
                      </Link>
                    )}
                  </div>

                  {/* Expanded JSON details */}
                  {isExpanded && (
                    <div className="px-10 pb-4 pt-1 bg-slate-950/70 border-t border-slate-800/50">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400 uppercase font-bold">
                          <span>Structured Attributes</span>
                          <span>ID: {log.id}</span>
                        </div>
                        <pre className="overflow-x-auto text-slate-300 font-mono">
                          {JSON.stringify(
                            {
                              timestamp: log.timestamp,
                              level: log.level,
                              service: log.service,
                              traceId: log.traceId,
                              spanId: log.spanId,
                              message: log.message,
                              attributes: log.attributes || {
                                "host.name": "ubuntu-wsl",
                                "service.version": "1.0.0",
                                "deployment.environment": "docker-compose",
                              },
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function LogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading logs...</div>}>
      <LogsContent />
    </Suspense>
  );
}
