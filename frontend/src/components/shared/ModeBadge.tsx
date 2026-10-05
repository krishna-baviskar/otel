import React from 'react';
import { DataMode } from '@/types/telemetry';

export interface ModeBadgeProps {
  mode: DataMode | string;
  className?: string;
}

export const ModeBadge: React.FC<ModeBadgeProps> = ({ mode, className = '' }) => {
  const configs: Record<string, { bg: string; label: string; tooltip: string }> = {
    LIVE: {
      bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
      label: 'LIVE DYNATRACE',
      tooltip: 'Real-time telemetry streaming from connected Dynatrace tenant / cloud backend',
    },
    LOCAL: {
      bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
      label: 'LOCAL STACK',
      tooltip: 'Real-time telemetry gathered from local Docker Compose environment (Tempo, OTel Collector, Microservices)',
    },
    DEMO: {
      bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
      label: 'DEMO DATA',
      tooltip: 'Controlled sample observability data for offline presentations',
    },
  };

  const current = configs[mode] || {
    bg: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
    label: mode,
    tooltip: '',
  };

  return (
    <div
      title={current.tooltip}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase border shadow-sm ${current.bg} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {current.label}
    </div>
  );
};

export default ModeBadge;
