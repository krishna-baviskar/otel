"use client";

import React, { useState, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { TransactionModal } from "../demo/TransactionModal";
import { IncidentSimulatorModal } from "../demo/IncidentSimulatorModal";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const checkSimulationStatus = async () => {
    try {
      const res = await fetch("/api/simulation");
      if (res.ok) {
        const data = await res.json();
        setIsSimulating(data.active);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkSimulationStatus();
    const interval = setInterval(checkSimulationStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header
        onRunTransaction={() => setIsTransactionOpen(true)}
        onOpenSimulation={() => setIsIncidentOpen(true)}
        isSimulating={isSimulating}
      />

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      <TransactionModal
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
      />

      <IncidentSimulatorModal
        isOpen={isIncidentOpen}
        onClose={() => setIsIncidentOpen(false)}
        onStateChange={checkSimulationStatus}
      />
    </div>
  );
}
