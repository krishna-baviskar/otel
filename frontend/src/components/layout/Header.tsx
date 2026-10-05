'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Layers, 
  RotateCw, 
  PlayCircle, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ExternalLink 
} from 'lucide-react';
import { ModeBadge } from '@/components/shared/ModeBadge';
import { SystemStatus } from '@/types/telemetry';

interface HeaderProps {
  onRunTransaction?: () => void;
  onOpenSimulation?: () => void;
  isSimulating?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onRunTransaction,
  onOpenSimulation,
  isSimulating = false,
}) => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telemetry/status');
      if (res.ok) {
        const json = await res.json();
        setStatus(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-[#1c2947] bg-[#090d18]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Brand & Platform Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-100 text-sm tracking-wider uppercase">
              Observability Control Center
            </h1>
            <ModeBadge mode={status?.mode || 'LOCAL'} />
          </div>
          <p className="text-[11px] text-slate-400">
            OpenTelemetry • Distributed Microservices • PurePath Hybrid Tracing
          </p>
        </div>
      </div>

      {/* Center Telemetry & Integration Pills */}
      <div className="hidden lg:flex items-center gap-3">
        {/* OpenTelemetry Health Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#11192e] border border-[#1e2d4f] text-xs">
          <span className="text-slate-400 font-medium">OpenTelemetry:</span>
          {status?.openTelemetry.status === 'Healthy' ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Healthy ({status?.openTelemetry.acceptedSpans || 78} spans)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Connecting
            </span>
          )}
        </div>

        {/* Dynatrace Integration Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#11192e] border border-[#1e2d4f] text-xs">
          <span className="text-slate-400 font-medium">Dynatrace:</span>
          {status?.dynatrace.connected ? (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-cyan-300 font-medium" title={status?.dynatrace.statusText}>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Demo Mode
            </span>
          )}
        </div>

        {/* Environment */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#11192e] border border-[#1e2d4f] text-xs text-slate-300 font-medium">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Local Docker</span>
        </div>
      </div>

      {/* Right Controls: Quick Actions & Refresh */}
      <div className="flex items-center gap-3">
        {/* Incident Simulation Toggle */}
        <button
          onClick={onOpenSimulation}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
            isSimulating
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse'
              : 'bg-[#11192e] text-slate-300 border-[#1e2d4f] hover:border-amber-500/50 hover:text-amber-300'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{isSimulating ? 'Incident Active' : 'Simulate Incident'}</span>
        </button>

        {/* Run Transaction Demo Button */}
        <button
          onClick={onRunTransaction}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Run Transaction</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="p-1.5 rounded-md bg-[#11192e] border border-[#1e2d4f] text-slate-400 hover:text-slate-100 hover:border-slate-500 transition-colors"
          title="Refresh telemetry"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
