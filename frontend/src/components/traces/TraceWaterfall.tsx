"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  TraceDetail, 
  Span 
} from "@/types/telemetry";
import { 
  Clock, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Check, 
  FileText, 
  Search,
  ExternalLink,
  Code2,
  Calendar,
  Sparkles
} from "lucide-react";
import StatusBadge from "../shared/StatusBadge";
import ModeBadge from "../shared/ModeBadge";

interface TraceWaterfallProps {
  trace: TraceDetail;
}

export default function TraceWaterfall({ trace }: TraceWaterfallProps) {
  const spans = Array.isArray(trace?.spans) ? trace.spans : [];

  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(
    spans[0]?.id || null
  );
  const [copiedTrace, setCopiedTrace] = useState(false);
  const [copiedSpan, setCopiedSpan] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedSpans, setCollapsedSpans] = useState<Set<string>>(new Set());

  // Find min start and max end to normalize timeline
  const minTime = spans.length > 0 ? Math.min(...spans.map((s) => s.startTime ?? 0)) : 0;
  const maxTime = spans.length > 0 ? Math.max(...spans.map((s) => s.endTime ?? s.duration ?? 1)) : 1;
  const rawDuration = trace?.duration ?? (maxTime - minTime);
  const totalDuration = Math.max(1, rawDuration);

  const selectedSpan = spans.find((s) => s.id === selectedSpanId) || spans[0];

  const handleCopyTrace = () => {
    if (trace?.id) {
      navigator.clipboard.writeText(trace.id);
      setCopiedTrace(true);
      setTimeout(() => setCopiedTrace(false), 2000);
    }
  };

  const handleCopySpan = (spanId: string) => {
    navigator.clipboard.writeText(spanId);
    setCopiedSpan(true);
    setTimeout(() => setCopiedSpan(false), 2000);
  };

  // Color mapping per service
  const getServiceColor = (serviceName: string) => {
    switch (serviceName) {
      case "backend":
        return { bg: "bg-indigo-500", text: "text-indigo-400", border: "border-indigo-500/30", bar: "#6366f1" };
      case "mail-service":
        return { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", bar: "#f59e0b" };
      case "template-service":
        return { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", bar: "#10b981" };
      case "redis":
        return { bg: "bg-red-500", text: "text-red-400", border: "border-red-500/30", bar: "#ef4444" };
      case "mongodb":
      case "mongo":
        return { bg: "bg-teal-500", text: "text-teal-400", border: "border-teal-500/30", bar: "#14b8a6" };
      case "external-mail":
        return { bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/30", bar: "#a855f7" };
      default:
        return { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30", bar: "#3b82f6" };
    }
  };

  const filteredSpans = spans.filter((s) => {
    if (!searchTerm) return true;
    return (
      (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.serviceName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      {/* Trace Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Distributed Trace</span>
              <span className="font-mono text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-blue-400">
                {trace?.id}
              </span>
              <button
                onClick={handleCopyTrace}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                title="Copy Trace ID"
              >
                {copiedTrace ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <ModeBadge mode={trace?.source === "tempo" ? "LOCAL" : "LIVE"} />
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {trace?.rootOperation || "Distributed Operation"}
              {trace?.hasErrors && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Error in trace
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/logs?traceId=${trace?.id}`}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Correlated Logs
            </Link>
            <a
              href={`http://localhost:3000/explore?left=%5B%22now-1h%22,%22now%22,%22Tempo%22,%7B%22query%22:%22${trace?.id}%22%7D%5D`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium border border-blue-500/30 flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Grafana
            </a>
          </div>
        </div>

        {/* Trace Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Total Duration</span>
            <div className="flex items-center gap-1.5 font-mono text-base font-bold text-white">
              <Clock className="w-4 h-4 text-blue-400" />
              {totalDuration.toFixed(2)} ms
            </div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Spans Count</span>
            <div className="flex items-center gap-1.5 font-mono text-base font-bold text-white">
              <Layers className="w-4 h-4 text-indigo-400" />
              {trace?.spanCount ?? spans.length} spans
            </div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Services Involved</span>
            <div className="flex items-center gap-1.5 font-mono text-base font-bold text-white">
              <Code2 className="w-4 h-4 text-emerald-400" />
              {trace?.services?.length ?? 0} services
            </div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block mb-1">Timestamp</span>
            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {trace?.timestamp ? new Date(trace.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Waterfall Grid: Spans on left, Details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Waterfall FlameGraph */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
          {/* Waterfall Control Bar */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter span name or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Timeline: 0ms to {totalDuration.toFixed(1)}ms
            </div>
          </div>

          {/* Timeline Scale Ruler */}
          <div className="grid grid-cols-12 px-4 py-1.5 bg-slate-950/40 border-b border-slate-800 text-[10px] text-slate-500 font-mono">
            <div className="col-span-5">SPAN HIERARCHY</div>
            <div className="col-span-7 flex justify-between pr-4">
              <span>0ms</span>
              <span>{(totalDuration * 0.25).toFixed(1)}ms</span>
              <span>{(totalDuration * 0.5).toFixed(1)}ms</span>
              <span>{(totalDuration * 0.75).toFixed(1)}ms</span>
              <span>{totalDuration.toFixed(1)}ms</span>
            </div>
          </div>

          {/* Waterfall Rows */}
          <div className="divide-y divide-slate-800/50 overflow-y-auto max-h-[580px]">
            {filteredSpans.map((span) => {
              const colors = getServiceColor(span.serviceName);
              const isSelected = selectedSpan?.id === span.id;

              // Timeline calculations
              const spanStart = span.startTime ?? 0;
              const spanDuration = Math.max(0.1, span.duration ?? 0.1);
              const offsetMs = Math.max(0, spanStart - minTime);
              const leftPercent = Math.min(95, Math.max(0, (offsetMs / totalDuration) * 100));
              const widthPercent = Math.max(1.5, Math.min(100 - leftPercent, (spanDuration / totalDuration) * 100));
              const isError = span.status?.code === "ERROR";

              return (
                <div
                  key={span.id}
                  onClick={() => setSelectedSpanId(span.id)}
                  className={`grid grid-cols-12 px-3 py-2 cursor-pointer transition-colors text-xs items-center ${
                    isSelected
                      ? "bg-blue-950/40 border-l-2 border-blue-500"
                      : "hover:bg-slate-850 hover:bg-slate-800/40"
                  }`}
                >
                  {/* Left Column: Span hierarchy name & service */}
                  <div
                    className="col-span-5 flex items-center gap-1.5 truncate pr-2"
                    style={{ paddingLeft: `${(span.depth ?? 0) * 14}px` }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colors.bar }}
                    />
                    <span className="font-semibold text-slate-200 truncate">{span.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${colors.text} bg-slate-950/60 border ${colors.border}`}>
                      {span.serviceName}
                    </span>
                    {isError && (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    )}
                  </div>

                  {/* Right Column: Gantt Bar */}
                  <div className="col-span-7 relative h-5 flex items-center pr-4">
                    <div className="w-full h-2 bg-slate-950 rounded-full relative overflow-hidden">
                      <div
                        className="absolute h-full rounded-full transition-all duration-300"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          backgroundColor: isError ? "#ef4444" : colors.bar,
                        }}
                      />
                    </div>
                    {/* Duration badge positioned next to bar */}
                    <span
                      className="absolute text-[10px] font-mono text-slate-400"
                      style={{
                        left: `${Math.min(85, leftPercent + widthPercent + 1)}%`,
                      }}
                    >
                      {spanDuration.toFixed(1)}ms
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Span Details Inspector */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col max-h-[640px] overflow-y-auto">
          {selectedSpan ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    Span Inspector
                  </span>
                  <StatusBadge status={selectedSpan.status?.code === "ERROR" ? "unhealthy" : "healthy"} />
                </div>
                <h3 className="text-base font-bold text-white mt-1 break-all">{selectedSpan.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  Service: <span className="font-semibold text-slate-200">{selectedSpan.serviceName}</span>
                  {selectedSpan.kind && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedSpan.kind}
                    </span>
                  )}
                </p>
              </div>

              {/* Span IDs & timing */}
              <div className="space-y-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Span ID:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-200 text-[11px]">{selectedSpan.id}</span>
                    <button
                      onClick={() => handleCopySpan(selectedSpan.id)}
                      className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {copiedSpan ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                {selectedSpan.parentId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Parent ID:</span>
                    <span className="font-mono text-slate-300 text-[11px]">{selectedSpan.parentId}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-mono font-bold text-white">{(selectedSpan.duration ?? 0).toFixed(2)} ms</span>
                </div>
              </div>

              {/* Error message alert if present */}
              {selectedSpan.status?.message && (
                <div className="bg-red-950/50 border border-red-800/80 rounded-lg p-3 text-xs text-red-300">
                  <div className="flex items-center gap-1.5 font-semibold text-red-200 mb-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Error Details
                  </div>
                  <p className="font-mono text-[11px] break-all">{selectedSpan.status.message}</p>
                </div>
              )}

              {/* OpenTelemetry Attributes */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  Span Attributes ({Object.keys(selectedSpan.attributes || {}).length})
                </h4>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {Object.entries(selectedSpan.attributes || {}).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex flex-col p-2 rounded bg-slate-950 border border-slate-800/80 text-[11px]"
                    >
                      <span className="font-mono text-slate-400 text-[10px] break-all">{k}</span>
                      <span className="font-mono text-slate-200 mt-0.5 break-all">
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Span Events */}
              {selectedSpan.events && selectedSpan.events.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Span Events ({selectedSpan.events.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedSpan.events.map((evt, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[11px]"
                      >
                        <div className="flex items-center justify-between text-slate-300 font-semibold">
                          <span>{evt.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {evt.timestamp ? `${evt.timestamp}ms` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a span from the waterfall to inspect its attributes and events
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
