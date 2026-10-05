"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  RotateCw, 
  ArrowRight, 
  Flame, 
  ShieldAlert, 
  Cpu, 
  Play, 
  Square,
  Sparkles,
  GitFork,
  ExternalLink
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ModeBadge from "@/components/shared/ModeBadge";
import { Incident } from "@/types/telemetry";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const [incRes, simRes] = await Promise.all([
        fetch("/api/telemetry/incidents"),
        fetch("/api/simulation"),
      ]);

      if (incRes.ok) {
        const data = await incRes.json();
        if (data.incidents) setIncidents(data.incidents);
      }
      if (simRes.ok) {
        const simData = await simRes.json();
        setActiveScenario(simData.active ? simData.scenario : null);
      }
    } catch (err) {
      console.error("Failed to fetch incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 6000);
    return () => clearInterval(interval);
  }, []);

  const triggerSimulation = async (scenario: string) => {
    try {
      await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", scenario }),
      });
      fetchIncidents();
    } catch (err) {
      console.error("Failed to start simulation:", err);
    }
  };

  const resolveSimulation = async () => {
    try {
      await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      fetchIncidents();
    } catch (err) {
      console.error("Failed to stop simulation:", err);
    }
  };

  const activeIncidents = incidents.filter((i) => i.status === "active");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">AIOps & Root Cause</span>
            <ModeBadge mode="LOCAL" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-rose-500" />
            Incidents & Davis® AI Root-Cause Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated anomaly detection, causal dependency graph correlation, and remediation paths.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeScenario ? (
            <button
              onClick={resolveSimulation}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolve Active Incident
            </button>
          ) : (
            <button
              onClick={() => triggerSimulation("redis_slowdown")}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-rose-600/30"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Simulate Redis Outage
            </button>
          )}

          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh Incidents"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Davis AI Engine Explanation Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-900/40 rounded-xl p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-purple-900/50 text-purple-300 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Davis® AI Causation Engine
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/80 text-purple-300 border border-purple-700 font-mono">
                PurePath Correlation
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Davis AI traverses the microservices dependency graph in real time, filtering out alert storms 
              by linking symptom events (such as elevated error rates on <code>backend:4000</code>) directly to their 
              originating root cause (e.g., latency spikes in <code>redis:6379</code>).
            </p>
          </div>
        </div>
      </div>

      {/* Active Incidents Section */}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          Active Incidents ({activeIncidents.length})
        </h2>

        {activeIncidents.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-200">All Microservices Healthy</h3>
            <p className="text-xs text-slate-500 mt-1">
              No anomalies or SLA degradations detected across the OpenTelemetry pipeline.
            </p>
            <button
              onClick={() => triggerSimulation("redis_slowdown")}
              className="mt-4 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 text-amber-400" /> Inject Demo Outage
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeIncidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-slate-900 border border-rose-800/80 rounded-xl p-5 shadow-xl relative overflow-hidden"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 uppercase">
                        {inc.severity} SEVERITY
                      </span>
                      <span className="font-mono text-xs text-slate-500">ID: {inc.id}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">
                        Detected: {new Date(inc.startedAt || inc.startTime || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{inc.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={resolveSimulation}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                    >
                      Resolve Incident
                    </button>
                  </div>
                </div>

                {/* Root Cause & Impacted Services */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400 block mb-1">
                      Davis® Root Cause Hypothesis
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-mono">
                      {inc.rootCause}
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Impacted Microservices
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(inc.impactedServices || (inc.affectedService ? [inc.affectedService] : [])).map((svc) => (
                        <span
                          key={svc}
                          className="px-2 py-1 rounded bg-rose-950/50 border border-rose-800/80 text-rose-300 font-mono text-xs font-semibold"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Remediation Plan */}
                <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 text-xs">
                  <span className="font-bold text-slate-300 block mb-1">Recommended Remediation Action:</span>
                  <p className="text-slate-400">
                    Inspect Redis memory limits and active client connections in docker-compose.yaml. Verify Redis connection timeouts in backend Go service (<code>services/backend/main.go</code>).
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Resolved Incidents */}
      {resolvedIncidents.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            Resolved Incident History ({resolvedIncidents.length})
          </h2>
          <div className="space-y-3">
            {resolvedIncidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      RESOLVED
                    </span>
                    <span className="font-bold text-slate-200">{inc.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Root Cause: {inc.rootCause}
                  </p>
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono">
                  Duration: 4m 12s
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
