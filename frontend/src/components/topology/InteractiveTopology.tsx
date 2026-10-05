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
  AlertTriangle,
  Send,
  Laptop
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
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

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
    const interval = setInterval(fetchTopology, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleNodeClick = (nodeId: string) => {
    const next = selectedNodeId === nodeId ? null : nodeId;
    setSelectedNodeId(next);
    if (onSelectService) onSelectService(next);
  };

  const handleTriggerLiveRequest = async () => {
    try {
      setTriggering(true);
      const res = await fetch('/api/telemetry/trigger-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'signup' }),
      });
      const data = await res.json();
      setTriggerMsg(data.message || 'Request executed!');
      fetchTopology();
      setTimeout(() => setTriggerMsg(null), 3500);
    } catch (err) {
      console.error('Trigger failed:', err);
    } finally {
      setTriggering(false);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Icon selector based on node type
  const getNodeIcon = (type: string, id: string) => {
    if (type === "client" || id === "client") return <Laptop className="w-5 h-5 text-sky-400" />;
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
    <div className={`relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden ${compact ? "h-[480px]" : "h-[700px]"}`}>
      {/* Topology Toolbar */}
      <div className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs shadow-md">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            Live Distributed Topology
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono">{nodes.length} Nodes</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono">{links.length} Connected Streams</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Real-time (4s poll)
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {triggerMsg && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800 animate-in fade-in">
              {triggerMsg}
            </span>
          )}

          <button
            onClick={handleTriggerLiveRequest}
            disabled={triggering}
            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
            title="Sends a real registration request through all 8 microservices"
          >
            <Send className={`w-3 h-3 ${triggering ? "animate-spin" : ""}`} />
            {triggering ? "Sending..." : "⚡ Send Real Request"}
          </button>

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
        <svg
          viewBox="0 0 1000 650"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        >
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

            // Map node percentage position (0-100) to SVG viewBox coordinates (1000 x 650)
            const x1 = (sourceNode.position?.x ?? 50) * 10;
            const y1 = (sourceNode.position?.y ?? 50) * 6.5;
            const x2 = (targetNode.position?.x ?? 50) * 10;
            const y2 = (targetNode.position?.y ?? 50) * 6.5;

            const isHighlighted = selectedNodeId === link.source || selectedNodeId === link.target;
            const pathId = `link-path-${link.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
            const pathD = `M ${x1} ${y1} L ${x2} ${y2}`;

            return (
              <g key={link.id}>
                {/* Background Link Line */}
                <path
                  id={pathId}
                  d={pathD}
                  stroke={isHighlighted ? "#60a5fa" : link.protocol === "OTLP" ? "#06b6d4" : "#334155"}
                  strokeWidth={isHighlighted ? 2.5 : link.protocol === "OTLP" ? 1.5 : 1.8}
                  strokeDasharray={link.protocol === "OTLP" ? "4 4" : undefined}
                  fill="none"
                  className="transition-all duration-300"
                />

                {/* Animated Traffic Particle flowing along the path */}
                {trafficPulse && (
                  <circle
                    r={isHighlighted ? 4 : 2.5}
                    fill={isHighlighted ? "#93c5fd" : link.protocol === "OTLP" ? "#22d3ee" : "#38bdf8"}
                  >
                    <animateMotion
                      dur={`${Math.max(1.2, 3.8 - (link.callCount || 10) / 100)}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
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
        <div className="absolute right-4 bottom-4 w-84 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-4 shadow-2xl z-30 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {getNodeIcon(selectedNode.type, selectedNode.id)}
              <div>
                <h4 className="text-sm font-bold text-slate-100">{selectedNode.name}</h4>
                <p className="text-[10px] text-slate-400 capitalize">{selectedNode.technology || selectedNode.type}</p>
              </div>
            </div>
            <StatusBadge status={selectedNode.status} />
          </div>

          <div className="grid grid-cols-2 gap-2 my-3 text-xs">
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Avg Latency</span>
              <span className="font-mono font-bold text-slate-200">{(selectedNode.latency ?? 0).toFixed(1)} ms</span>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Throughput</span>
              <span className="font-mono font-bold text-slate-200">{selectedNode.rpm || 312} RPM</span>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Instrumented By</span>
              <span className="font-mono text-[11px] text-blue-400 font-semibold">{selectedNode.monitoredBy || "OpenTelemetry"}</span>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Network Port</span>
              <span className="font-mono text-[11px] text-slate-300">{selectedNode.port ? `:${selectedNode.port}` : "Internal"}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            {selectedNode.description}
          </p>

          <div className="flex items-center gap-2">
            <Link
              href={`/traces?service=${selectedNode.id}`}
              className="flex-1 text-center py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              Explore Traces <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
