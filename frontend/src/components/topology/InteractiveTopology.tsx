"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Server, 
  Database, 
  Layers, 
  Activity, 
  ArrowRight, 
  Zap, 
  RefreshCw, 
  Maximize2, 
  ExternalLink,
  ShieldAlert,
  Cpu,
  Radio,
  FileCode2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import StatusBadge from "../shared/StatusBadge";
import ModeBadge from "../shared/ModeBadge";
import { ServiceNode, ServiceLink } from "@/types/telemetry";

interface InteractiveTopologyProps {
  compact?: boolean;
  selectedServiceId?: string;
  onSelectService?: (serviceId: string | null) => void;
}

export default function InteractiveTopology({
  compact = false,
  selectedServiceId: controlledSelectedId,
  onSelectService,
}: InteractiveTopologyProps) {
  const [nodes, setNodes] = useState<ServiceNode[]>([]);
  const [links, setLinks] = useState<ServiceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(controlledSelectedId || null);
  const [trafficPulse, setTrafficPulse] = useState(true);

  // Sync with controlled prop if provided
  useEffect(() => {
    if (controlledSelectedId !== undefined) {
      setSelectedNodeId(controlledSelectedId);
    }
  }, [controlledSelectedId]);

  const fetchTopology = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/telemetry/topology");
      const data = await res.json();
      if (data.nodes) setNodes(data.nodes);
      if (data.links) setLinks(data.links);
    } catch (err) {
      console.error("Failed to load topology:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopology();
    const interval = setInterval(fetchTopology, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleNodeClick = (nodeId: string) => {
    const next = selectedNodeId === nodeId ? null : nodeId;
    setSelectedNodeId(next);
    if (onSelectService) onSelectService(next);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Icon selector based on node type
  const getNodeIcon = (type: string, id: string) => {
    if (type === "database") return <Database className="w-5 h-5 text-emerald-400" />;
    if (type === "cache") return <Layers className="w-5 h-5 text-red-400" />;
    if (type === "collector") return <Radio className="w-5 h-5 text-cyan-400" />;
    if (type === "backend") return <Server className="w-5 h-5 text-indigo-400" />;
    if (id === "loadgen") return <Zap className="w-5 h-5 text-amber-400" />;
    return <Activity className="w-5 h-5 text-blue-400" />;
  };

  const getNodeBorderColor = (status: string, isSelected: boolean) => {
    if (isSelected) return "border-blue-500 ring-2 ring-blue-500/50";
    if (status === "unhealthy") return "border-red-500 animate-pulse";
    if (status === "degraded") return "border-amber-500";
    return "border-slate-800 hover:border-slate-700";
  };

  return (
    <div className={`relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden ${compact ? "h-[450px]" : "h-[680px]"}`}>
      {/* Topology Toolbar */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            Live Service Dependency Graph
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">{nodes.length} Nodes</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">{links.length} Active Edges</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setTrafficPulse(!trafficPulse)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              trafficPulse 
                ? "bg-blue-950/60 border-blue-800 text-blue-300" 
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <Activity className="w-3 h-3" />
            {trafficPulse ? "Pulse ON" : "Pulse OFF"}
          </button>
          <button
            onClick={fetchTopology}
            className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh Topology"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
          {!compact && (
            <Link
              href="/topology"
              className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Full screen view"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Main SVG and Canvas */}
      <div className="w-full h-full relative overflow-auto select-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
        {/* SVG Links */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="link-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {links.map((link) => {
            const sourceNode = nodes.find((n) => n.id === link.source);
            const targetNode = nodes.find((n) => n.id === link.target);
            if (!sourceNode || !targetNode) return null;

            // Compute center coords (scale percentages to container)
            const x1 = `${sourceNode.position?.x ?? 50}%`;
            const y1 = `${sourceNode.position?.y ?? 50}%`;
            const x2 = `${targetNode.position?.x ?? 50}%`;
            const y2 = `${targetNode.position?.y ?? 50}%`;

            const isHighlighted = selectedNodeId === link.source || selectedNodeId === link.target;

            return (
              <g key={link.id}>
                {/* Background Link Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isHighlighted ? "#60a5fa" : "#334155"}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={link.protocol === "telemetry" ? "4 4" : undefined}
                  className="transition-all duration-300"
                />

                {/* Animated Traffic Particle */}
                {trafficPulse && (
                  <circle r={isHighlighted ? 3.5 : 2.5} fill={isHighlighted ? "#93c5fd" : "#38bdf8"}>
                    <animateMotion
                      path={`M 0 0 L 0 0`} // placeholder, using animate to x/y
                      dur={`${Math.max(1.2, 4 - (link.callCount || 10) / 40)}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes positioned absolutely */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          return (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node.id)}
              style={{
                left: `${node.position?.x ?? 50}%`,
                top: `${node.position?.y ?? 50}%`,
                transform: "translate(-50%, -50%)",
              }}
              className={`absolute z-10 cursor-pointer transition-all duration-200 group`}
            >
              <div
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-900/95 backdrop-blur-md border ${getNodeBorderColor(
                  node.status,
                  isSelected
                )} shadow-lg shadow-black/50 hover:shadow-blue-500/10 hover:scale-105`}
              >
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                  {getNodeIcon(node.type, node.id)}
                </div>

                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                      {node.name}
                    </span>
                    <span className="w-2 h-2 rounded-full ring-2 ring-slate-900" style={{
                      backgroundColor: node.status === "healthy" ? "#10b981" : node.status === "degraded" ? "#f59e0b" : "#ef4444"
                    }} />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="capitalize">{node.type}</span>
                    {node.latency !== undefined && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-slate-300">{node.latency.toFixed(0)}ms</span>
                      </>
                    )}
                    {node.errorRate !== undefined && node.errorRate > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-red-400">{node.errorRate.toFixed(1)}% err</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status pulse indicator for degraded/unhealthy */}
              {node.status !== "healthy" && (
                <div className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Node Details Side/Bottom Drawer */}
      {selectedNode && (
        <div className="absolute right-4 bottom-4 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-4 shadow-2xl z-30 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {getNodeIcon(selectedNode.type, selectedNode.id)}
              <div>
                <h4 className="text-sm font-bold text-slate-100">{selectedNode.name}</h4>
                <p className="text-[10px] text-slate-400 capitalize">{selectedNode.type} Component</p>
              </div>
            </div>
            <StatusBadge status={selectedNode.status} />
          </div>

          <div className="grid grid-cols-2 gap-2 my-3 text-xs">
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Avg Latency</span>
              <span className="font-mono font-bold text-slate-200">{selectedNode.latency?.toFixed(1) || "12.4"} ms</span>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Error Rate</span>
              <span className={`font-mono font-bold ${selectedNode.errorRate && selectedNode.errorRate > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {selectedNode.errorRate?.toFixed(2) || "0.00"}%
              </span>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Throughput</span>
              <span className="font-mono font-bold text-slate-200">{selectedNode.rpm || "45"} rpm</span>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">OTel Export</span>
              <span className="font-mono font-bold text-cyan-400">gRPC :4317</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex items-center justify-between text-slate-400">
              <span>Protocol</span>
              <span className="font-mono text-slate-200">{selectedNode.id === "template-service" ? "gRPC / HTTP" : "HTTP/REST"}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Environment</span>
              <span className="font-mono text-slate-200">Docker (Ubuntu WSL2)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Dynatrace OneAgent</span>
              <span className="font-mono text-amber-400">Simulated / Dev</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Dismiss
            </button>
            <Link
              href={`/services/${selectedNode.id}`}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              View Service Details
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
