"use client";

import React, { useState } from "react";
import { 
  Play, 
  RefreshCw, 
  Terminal, 
  Table as TableIcon, 
  Code2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";
import ModeBadge from "../shared/ModeBadge";

interface DqlResult {
  query: string;
  executionTimeMs: number;
  recordsCount: number;
  mode: "LIVE" | "LOCAL" | "DEMO";
  columns: string[];
  records: Record<string, any>[];
  rawDqlEquivalent?: string;
}

const PRESET_QUERIES = [
  {
    title: "Slowest Service Operations",
    query: `fetch spans
| filter isNotNull(duration)
| summarize avg_duration = avg(duration), max_duration = max(duration), count = count(), by:{service.name, span.name}
| sort avg_duration desc
| limit 10`,
  },
  {
    title: "Failed Signup Spans",
    query: `fetch spans
| filter service.name == "backend" or service.name == "mail-service"
| filter status.code == "ERROR"
| fields timestamp, trace.id, span.name, status.message
| sort timestamp desc
| limit 20`,
  },
  {
    title: "gRPC Template-Service Traffic",
    query: `fetch spans
| filter service.name == "template-service"
| filter rpc.system == "grpc"
| summarize total_calls = count(), p95 = percentile(duration, 95), by:{rpc.method}
| sort total_calls desc`,
  },
  {
    title: "Application Error Rates",
    query: `fetch logs
| filter loglevel == "ERROR" or loglevel == "WARN"
| summarize error_count = count(), by:{service.name, loglevel}
| sort error_count desc`,
  },
];

export default function DqlConsole() {
  const [query, setQuery] = useState(PRESET_QUERIES[0].query);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DqlResult | null>(null);
  const [activeTab, setActiveTab] = useState<"table" | "json">("table");
  const [copied, setCopied] = useState(false);

  const runQuery = async (customQuery?: string) => {
    const q = customQuery || query;
    try {
      setLoading(true);
      const res = await fetch("/api/dql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Failed to run DQL query:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result.records, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Query Presets Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Preset DQL Queries:
        </span>
        {PRESET_QUERIES.map((preset) => (
          <button
            key={preset.title}
            onClick={() => {
              setQuery(preset.query);
              runQuery(preset.query);
            }}
            className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Query Editor Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Terminal className="w-4 h-4 text-purple-400" />
            Dynatrace Query Language (DQL) Editor
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">Grail Data Lakehouse Engine</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={5}
            className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-2.5 rounded-lg border border-slate-800/80 focus:outline-none focus:border-purple-500 resize-none"
            placeholder="fetch spans | filter ... | summarize ... | sort ..."
          />
        </div>

        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Supports fetch, filter, summarize, fieldsAdd, sort, limit
          </div>
          <button
            onClick={() => runQuery()}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-purple-900/30"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? "animate-spin" : "fill-white"}`} />
            {loading ? "Executing DQL..." : "Run Query"}
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-200">Query Results</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {result.recordsCount} records in {result.executionTimeMs.toFixed(1)}ms
              </span>
              <ModeBadge mode={result.mode} />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setActiveTab("table")}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    activeTab === "table" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  Table
                </button>
                <button
                  onClick={() => setActiveTab("json")}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    activeTab === "json" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  JSON
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Copy Results JSON"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {activeTab === "table" ? (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    {result.columns.map((col) => (
                      <th key={col} className="p-3 uppercase">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.records.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      {result.columns.map((col) => {
                        const val = row[col];
                        return (
                          <td key={col} className="p-3 font-mono text-slate-200 text-xs">
                            {typeof val === "object" ? JSON.stringify(val) : String(val ?? "-")}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-slate-950 max-h-96 overflow-y-auto">
              <pre className="font-mono text-xs text-slate-300">
                {JSON.stringify(result.records, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
