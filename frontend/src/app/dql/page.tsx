"use client";

import React from "react";
import DqlConsole from "@/components/dql/DqlConsole";
import ModeBadge from "@/components/shared/ModeBadge";
import { 
  SearchCode, 
  Terminal, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Flame,
  HelpCircle
} from "lucide-react";

export default function DqlPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Grail Data Lakehouse</span>
            <ModeBadge mode="LOCAL" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SearchCode className="w-6 h-6 text-purple-400" />
            Dynatrace Query Language (DQL) Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Query OpenTelemetry spans, traces, and metrics using Dynatrace DQL syntax and Grail pipeline semantics.
          </p>
        </div>
      </div>

      {/* Embedded DQL Console */}
      <DqlConsole />

      {/* Educational DQL Cheat Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          DQL Syntax Reference & Command Cheatsheet
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="text-purple-400 font-bold block mb-1">1. fetch</span>
            <p className="text-slate-400 text-[11px] mb-2 font-sans">
              Specifies the data record type from Grail data lakehouse.
            </p>
            <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-200">
              <code>fetch spans</code><br />
              <code>fetch logs</code><br />
              <code>fetch dt.entity.service</code>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="text-purple-400 font-bold block mb-1">2. filter</span>
            <p className="text-slate-400 text-[11px] mb-2 font-sans">
              Filters records based on boolean predicates and field expressions.
            </p>
            <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-200">
              <code>| filter duration &gt; 50</code><br />
              <code>| filter status.code == "ERROR"</code><br />
              <code>| filter in(service.name, "backend")</code>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="text-purple-400 font-bold block mb-1">3. summarize</span>
            <p className="text-slate-400 text-[11px] mb-2 font-sans">
              Aggregates data over groups using statistical functions.
            </p>
            <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-200">
              <code>| summarize count = count()</code><br />
              <code>| summarize p95 = percentile(duration, 95)</code><br />
              <code>by:{`{service.name}`}</code>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="text-purple-400 font-bold block mb-1">4. fieldsAdd</span>
            <p className="text-slate-400 text-[11px] mb-2 font-sans">
              Computes new fields without dropping existing record columns.
            </p>
            <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-200">
              <code>| fieldsAdd duration_sec = duration / 1000</code><br />
              <code>| fieldsAdd is_slow = duration &gt; 100</code>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="text-purple-400 font-bold block mb-1">5. sort</span>
            <p className="text-slate-400 text-[11px] mb-2 font-sans">
              Orders resulting records by one or multiple fields.
            </p>
            <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-200">
              <code>| sort duration desc</code><br />
              <code>| sort timestamp asc</code>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="text-purple-400 font-bold block mb-1">6. limit</span>
            <p className="text-slate-400 text-[11px] mb-2 font-sans">
              Caps the maximum number of records returned by the query.
            </p>
            <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-200">
              <code>| limit 20</code><br />
              <code>| limit 100</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
