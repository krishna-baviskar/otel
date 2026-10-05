import React from 'react';
import { ServiceHealth } from '@/types/telemetry';

export interface StatusBadgeProps {
  status: ServiceHealth | 'unhealthy' | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  const normalizedStatus = status === 'unhealthy' ? 'critical' : status;

  const styles: Record<string, string> = {
    healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    degraded: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    unknown: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  const dotColors: Record<string, string> = {
    healthy: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    degraded: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    critical: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
    unknown: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  const currentStyle = styles[normalizedStatus] || styles.unknown;
  const currentDot = dotColors[normalizedStatus] || dotColors.unknown;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border capitalize ${currentStyle} ${sizeClasses}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${currentDot} animate-pulse-subtle`} />
      )}
      {status}
    </span>
  );
};

export default StatusBadge;
