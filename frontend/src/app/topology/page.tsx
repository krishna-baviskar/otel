"use client";

import React, { useState } from "react";
import InteractiveTopology from "@/components/topology/InteractiveTopology";
import ModeBadge from "@/components/shared/ModeBadge";
import { 
  Network, 
  Layers, 
  Server, 
  Database, 
  Radio, 
  Zap, 
  Activity,
  Info
} from "lucide-react";

export default function TopologyPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Smartscape Topology</span>
            <ModeBadge mode="LOCAL" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Network className="w-6 h-6 text-blue-400" />
            Distributed Service Dependency Map
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end multi-tier topology showing active HTTP, gRPC, and database connections with live telemetry metrics.
          </p>
        </div>
      </div>

      {/* Interactive Topology Graph */}
      <InteractiveTopology 
        compact={false} 
        selectedServiceId={selectedService || undefined}
        onSelectService={setSelectedService}
      />

      {/* Legend & Architectural Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" />
            Component Types
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-200">Backend Services</span>
              <span className="text-slate-500 text-[11px]">(Go, Node.js)</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200">Databases</span>
              <span className="text-slate-500 text-[11px]">(MongoDB 4.4)</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-400" />
              <span className="text-slate-200">Cache Layer</span>
              <span className="text-slate-500 text-[11px]">(Redis 6.2)</span>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-200">Telemetry Collector</span>
              <span className="text-slate-500 text-[11px]">(OTel Collector 0.43.0)</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            Connection Protocols
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-blue-400">HTTP/REST</span>
              <span className="text-slate-500 text-[10px]">Client → Backend, Backend → Mail</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-emerald-400">gRPC (HTTP/2)</span>
              <span className="text-slate-500 text-[10px]">Mail → Template Service</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-amber-400">TCP RESP / Wire</span>
              <span className="text-slate-500 text-[10px]">Backend → Redis / Mongo</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-cyan-400">OTLP / gRPC</span>
              <span className="text-slate-500 text-[10px]">All Services → Collector:4317</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-purple-400" />
            Dynatrace Smartscape Mapping
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            In Dynatrace, Smartscape automatically analyzes vertical dependencies (Process → Host → Service) 
            and horizontal dependencies (Service → Service call trees). W3C TraceContext headers propagate 
            the transaction context seamlessly.
          </p>
        </div>
      </div>
    </div>
  );
}
