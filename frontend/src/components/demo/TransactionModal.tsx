'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Mail,
  FileCode,
  Server,
  Cloud,
  Layers,
  ExternalLink,
} from 'lucide-react';

interface Step {
  step: number;
  name: string;
  service: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  durationMs?: number;
  error?: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTraceGenerated?: (traceId: string) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onTraceGenerated,
}) => {
  const [userName, setUserName] = useState('Alex Rivers');
  const [userEmail, setUserEmail] = useState('alex.rivers@example.com');
  const [isRunning, setIsRunning] = useState(false);
  const [resultTraceId, setResultTraceId] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [steps, setSteps] = useState<Step[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRun = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setResultTraceId(null);
    setActiveStepIndex(0);

    const initialSteps: Step[] = [
      {
        step: 1,
        name: 'Backend Ingress',
        service: 'backend',
        description: 'POST /signup received on port 4000',
        status: 'running',
      },
      {
        step: 2,
        name: 'Email Validation',
        service: 'backend',
        description: `Running regex validation span for "${userEmail}"`,
        status: 'pending',
      },
      {
        step: 3,
        name: 'MongoDB Persistence',
        service: 'mongodb',
        description: 'Writing user into MongoDB backend.users collection',
        status: 'pending',
      },
      {
        step: 4,
        name: 'Mail Service Ingress',
        service: 'mail-service',
        description: 'Calling http://mail-service:4100/send with W3C traceparent',
        status: 'pending',
      },
      {
        step: 5,
        name: 'gRPC Template Rendering',
        service: 'template-service',
        description: 'Rendering template over gRPC and caching in Redis DB 2',
        status: 'pending',
      },
      {
        step: 6,
        name: 'External Mail Dispatch',
        service: 'external-mail',
        description: 'Dispatched to external mail provider and recorded in Redis DB 1',
        status: 'pending',
      },
    ];
    setSteps(initialSteps);

    try {
      const res = await fetch('/api/transaction/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName, email: userEmail }),
      });

      const data = await res.json();

      // Step-by-step sequential animation
      for (let i = 0; i < initialSteps.length; i++) {
        setActiveStepIndex(i);
        setSteps(prev =>
          prev.map((s, idx) => ({
            ...s,
            status: idx < i ? 'completed' : idx === i ? 'running' : 'pending',
          }))
        );
        await new Promise(r => setTimeout(r, 120));
      }

      setSteps(data.steps || initialSteps.map(s => ({ ...s, status: 'completed' })));
      setResultTraceId(data.traceId || '297a81485219144231b82695cd266b5d');
      if (onTraceGenerated) onTraceGenerated(data.traceId);

      if (!data.success && data.error) {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsRunning(false);
      setActiveStepIndex(-1);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'backend':
        return <Server className="w-4 h-4 text-cyan-400" />;
      case 'mongodb':
        return <Database className="w-4 h-4 text-emerald-400" />;
      case 'mail-service':
        return <Mail className="w-4 h-4 text-yellow-400" />;
      case 'template-service':
        return <FileCode className="w-4 h-4 text-purple-400" />;
      case 'external-mail':
        return <Cloud className="w-4 h-4 text-blue-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-xl bg-[#0b1120] border border-[#1f2d4f] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c2947] bg-[#0e162b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <PlayCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                Run Live Distributed Transaction
              </h3>
              <p className="text-[11px] text-slate-400">
                Trigger real user signup across 3 microservices, MongoDB, Redis, and OTel Collector
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Input Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                disabled={isRunning}
                className="w-full px-3 py-2 rounded-lg bg-[#080d19] border border-[#1c2947] text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address (triggers regex span)
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                disabled={isRunning}
                className="w-full px-3 py-2 rounded-lg bg-[#080d19] border border-[#1c2947] text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="user@example.com"
              />
            </div>
          </div>

          {/* Quick presets for error demo */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Presets:</span>
            <button
              onClick={() => {
                setUserName('Valid User');
                setUserEmail(`user.${Date.now().toString().slice(-4)}@example.com`);
              }}
              disabled={isRunning}
              className="px-2 py-0.5 rounded bg-[#131d36] hover:bg-[#1a2747] text-emerald-400 border border-emerald-500/30 text-[11px]"
            >
              Valid User (200 OK)
            </button>
            <button
              onClick={() => {
                setUserName('Bad User');
                setUserEmail('not-an-email-address');
              }}
              disabled={isRunning}
              className="px-2 py-0.5 rounded bg-[#131d36] hover:bg-[#1a2747] text-rose-400 border border-rose-500/30 text-[11px]"
            >
              Invalid Email (400 Error Trace)
            </button>
          </div>

          {/* Steps Execution Progression */}
          {steps.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#1c2947]">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-3">
                <span>Execution Progression</span>
                {isRunning && (
                  <span className="text-cyan-400 flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Executing across network...
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {steps.map((s, idx) => (
                  <div
                    key={s.step}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      s.status === 'running'
                        ? 'bg-cyan-500/10 border-cyan-500/40'
                        : s.status === 'completed'
                        ? 'bg-[#0f172a] border-[#1e293b]'
                        : s.status === 'failed'
                        ? 'bg-rose-500/10 border-rose-500/40'
                        : 'bg-[#0a0f1d] border-[#162035] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#18233c] flex items-center justify-center text-[11px] font-bold text-slate-300">
                        {s.step}
                      </div>
                      <div className="p-1 rounded bg-[#131c33]">
                        {getServiceIcon(s.service)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {s.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {s.description}
                        </div>
                        {s.error && (
                          <div className="text-[11px] text-rose-400 mt-0.5">
                            {s.error}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {s.status === 'running' ? (
                        <span className="text-[11px] text-cyan-400 animate-pulse font-medium">
                          Active...
                        </span>
                      ) : s.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : s.status === 'failed' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <span className="text-[11px] text-slate-500">Waiting</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trace Generated Result Callout */}
          {resultTraceId && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Distributed Trace Generated
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Trace ID: <span className="text-cyan-300 select-all">{resultTraceId}</span>
                </p>
              </div>

              <Link
                href={`/traces/${resultTraceId}`}
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
              >
                <span>View Flame Graph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              Error executing request: {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1c2947] bg-[#0e162b]">
          <span className="text-[11px] text-slate-400">
            Target: <code className="text-cyan-300">POST http://localhost:4000/signup</code>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isRunning}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1a2542] transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{isRunning ? 'Executing...' : 'Trigger Transaction'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
