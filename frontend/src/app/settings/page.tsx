"use client";

import React, { useState } from "react";
import ModeBadge from "@/components/shared/ModeBadge";
import { 
  Settings as SettingsIcon, 
  Server, 
  RotateCw, 
  CheckCircle2, 
  Save, 
  Globe, 
  Radio, 
  Flame, 
  ShieldCheck
} from "lucide-react";

export default function SettingsPage() {
  const [backendUrl, setBackendUrl] = useState("http://localhost:4000");
  const [collectorMetricsUrl, setCollectorMetricsUrl] = useState("http://localhost:8888/metrics");
  const [grafanaUrl, setGrafanaUrl] = useState("http://localhost:3000");
  const [pollingInterval, setPollingInterval] = useState("8000");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Configuration</span>
            <ModeBadge mode="LOCAL" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-300" />
            Environment & Telemetry Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Control service endpoints, polling intervals, and OpenTelemetry collector ingestion parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/30"
        >
          {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {saved ? "Settings Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Endpoints Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
          Microservices & Infrastructure Endpoints
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Backend Service URL</label>
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Go Gin Gateway (POST /signup, GET /health)</span>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">OTel Collector Prometheus Endpoint</label>
            <input
              type="text"
              value={collectorMetricsUrl}
              onChange={(e) => setCollectorMetricsUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Scraped for accepted/exported span counters</span>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Grafana / Tempo URL</label>
            <input
              type="text"
              value={grafanaUrl}
              onChange={(e) => setGrafanaUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Distributed Trace visualization & Tempo data source</span>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Live Polling Interval</label>
            <select
              value={pollingInterval}
              onChange={(e) => setPollingInterval(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="3000">3 seconds (High frequency)</option>
              <option value="5000">5 seconds (Standard)</option>
              <option value="8000">8 seconds (Recommended default)</option>
              <option value="15000">15 seconds (Low network overhead)</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">Frequency of background telemetry sync</span>
          </div>
        </div>
      </div>

      {/* System & Architecture Versions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Component Stack & Compatibility Matrix
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">OpenTelemetry Collector</span>
            <span className="text-slate-200 font-bold">0.43.0 (contrib)</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Grafana Tempo</span>
            <span className="text-slate-200 font-bold">1.3.2</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Frontend Stack</span>
            <span className="text-slate-200 font-bold">Next.js 16 + Tailwind</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Docker Host</span>
            <span className="text-slate-200 font-bold">WSL2 Ubuntu 26.04</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>GitHub Project: <a href="https://github.com/krishna-baviskar/otel" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">krishna-baviskar/otel</a></span>
          <span>Author: Krishna Baviskar</span>
        </div>
      </div>
    </div>
  );
}
