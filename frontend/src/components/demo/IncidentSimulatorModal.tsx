'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Play,
  Square,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Activity,
  Flame,
} from 'lucide-react';
import { SimulationState } from '@/lib/simulation-store';

interface IncidentSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStateChange?: () => void;
}

export const IncidentSimulatorModal: React.FC<IncidentSimulatorModalProps> = ({
  isOpen,
  onClose,
  onStateChange,
}) => {
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<SimulationState['scenario']>('redis_slowdown');
  const [loading, setLoading] = useState(false);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/simulation');
      if (res.ok) {
        const json = await res.json();
        setSimState(json);
        if (json.scenario) setSelectedScenario(json.scenario);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) fetchState();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = async (action: 'start' | 'stop') => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, scenario: selectedScenario }),
      });
      if (res.ok) {
        const json = await res.json();
        setSimState(json);
        if (onStateChange) onStateChange();
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const scenarios = [
    {
      id: 'redis_slowdown',
      title: 'Redis Cache Write & Thread Bottleneck',
      service: 'redis',
      impact: 'Cascades into Template Service and Mail Service delays (+6.5x latency)',
      severity: 'Critical',
      badge: 'High Impact',
    },
    {
      id: 'high_latency',
      title: 'gRPC Template Service CPU Saturation',
      service: 'template-service',
      impact: 'Slow template AST compilation, gRPC response times climb to ~920ms',
      severity: 'Critical',
      badge: 'gRPC Delay',
    },
    {
      id: 'service_error',
      title: 'Backend Validation Storm (HTTP 400/500)',
      service: 'backend',
      impact: 'Malformed signup payloads causing validation error burst (24.2% error rate)',
      severity: 'Warning',
      badge: 'Error Burst',
    },
    {
      id: 'external_failure',
      title: 'SaaS Mail Delivery Provider Timeout',
      service: 'external-mail',
      impact: 'HTTP socket connection drops to external mail service (38.0% timeout rate)',
      severity: 'Critical',
      badge: '3rd Party',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-xl bg-[#0b1120] border border-[#1f2d4f] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c2947] bg-[#0e162b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                Incident & Anomaly Simulator
              </h3>
              <p className="text-[11px] text-slate-400">
                Safe, reversible injection to test root-cause detection & alert routing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1a2542] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Active Status Callout */}
          {simState?.active ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                    Incident Active in Environment
                  </span>
                  <span className="text-[10px] text-rose-400 font-mono">
                    Started: {simState.startedAt ? new Date(simState.startedAt).toLocaleTimeString() : 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium mt-1">
                  {simState.incident?.title}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                  <span>Impacted Service: <strong className="text-rose-300">{simState.affectedService}</strong></span>
                  <span>Latency: <strong className="text-rose-300">+{simState.latencyMultiplier}x</strong></span>
                  <span>Errors: <strong className="text-rose-300">{simState.errorRate}%</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>All microservices operating under nominal baseline thresholds. No active anomalies.</span>
            </div>
          )}

          {/* Scenario Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Anomaly Scenario:
            </label>
            <div className="space-y-2">
              {scenarios.map(sc => {
                const isSelected = selectedScenario === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => !simState?.active && setSelectedScenario(sc.id as SimulationState['scenario'])}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                        : 'bg-[#0a0f1d] border-[#162035] hover:border-slate-600'
                    } ${simState?.active ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">
                          {sc.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#17223b] text-amber-300 font-mono">
                          {sc.service}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {sc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {sc.impact}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1c2947] bg-[#0e162b]">
          <span className="text-[11px] text-slate-500">
            Reversible: Click Stop at any time to return to normal
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1a2542] transition-colors"
            >
              Cancel
            </button>

            {simState?.active ? (
              <button
                onClick={() => handleToggle('stop')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Simulation</span>
              </button>
            ) : (
              <button
                onClick={() => handleToggle('start')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Incident Simulation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
