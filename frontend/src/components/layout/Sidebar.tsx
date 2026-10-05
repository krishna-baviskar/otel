'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  Network,
  ArrowRightLeft,
  GitCommit,
  LineChart,
  FileText,
  AlertOctagon,
  SearchCode,
  Radio,
  Flame,
  FlaskConical,
  Settings,
  GitBranch,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Services', href: '/services', icon: Server },
    { label: 'Topology', href: '/topology', icon: Network },
    { label: 'Requests', href: '/requests', icon: ArrowRightLeft },
    { label: 'Traces', href: '/traces', icon: GitCommit },
    { label: 'Metrics', href: '/metrics', icon: LineChart },
    { label: 'Logs', href: '/logs', icon: FileText },
    { label: 'Incidents', href: '/incidents', icon: AlertOctagon, badge: 'Live' },
    { label: 'DQL Explorer', href: '/dql', icon: SearchCode },
    { label: 'OpenTelemetry', href: '/opentelemetry', icon: Radio },
    { label: 'Dynatrace Hub', href: '/dynatrace', icon: Flame },
    { label: 'Demo Center', href: '/demo', icon: FlaskConical, badge: 'Interactive' },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-[#1c2947] bg-[#070b14] flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-3">
        <div className="px-3 py-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          Observability
        </div>
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#11192e] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      item.badge === 'Live'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#1c2947] bg-[#0a0f1c]/50">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Repository</span>
          <a
            href="https://github.com/krishna-baviskar/otel"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>krishna-baviskar/otel</span>
          </a>
        </div>
        <div className="text-[11px] text-slate-500">
          OTel Collector 0.43.0 • Tempo 1.3.2
        </div>
      </div>
    </aside>
  );
};
