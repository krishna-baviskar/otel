import { NextResponse } from 'next/server';
import { getLiveSystemStatus } from '@/lib/telemetry-service';
import { INITIAL_DEPENDENCIES } from '@/lib/constants';
import { getSimulationState } from '@/lib/simulation-store';

// Distinct, spacious coordinates across the 1000x650 canvas (in percentages)
//
//   [Client] ─────► [Backend] ──────► [Mail-Service] ────► [Template-Service]
//   (8%, 35%)         (28%, 35%)         (52%, 35%)            (76%, 22%)
//                        │                   │                      │
//                        ▼                   ▼                      ▼
//                    [MongoDB]        [External-Mail]            [Redis]
//                    (28%, 76%)          (92%, 35%)            (76%, 58%)
//                                            │
//                                            ▼
//                                     [OTel Collector]
//                                        (52%, 78%)
//
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  client:             { x: 8,  y: 35 },
  backend:            { x: 28, y: 35 },
  mongodb:            { x: 28, y: 76 },
  'mail-service':     { x: 52, y: 35 },
  'template-service': { x: 76, y: 22 },
  redis:              { x: 76, y: 58 },
  'external-mail':    { x: 92, y: 35 },
  'otel-collector':   { x: 52, y: 78 },
};

export async function GET() {
  try {
    const status = await getLiveSystemStatus();
    const sim = getSimulationState();

    // Build nodes array with explicit positions
    const nodes = Object.values(status.services).map((svc) => ({
      ...svc,
      latency: svc.avgLatency,
      rpm: Math.round(svc.requestRate * 60),
      position: NODE_POSITIONS[svc.id] ?? { x: 50, y: 50 },
    }));

    // Build links (matching what InteractiveTopology reads)
    const links = INITIAL_DEPENDENCIES.map((dep) => {
      let latency = dep.avgLatency ?? 12;
      let errorRate = dep.errorRate ?? 0;
      let linkStatus = dep.status;

      if (sim.active && (dep.target === sim.affectedService || dep.source === sim.affectedService)) {
        latency = Math.round(latency * sim.latencyMultiplier);
        errorRate = sim.errorRate;
        linkStatus = errorRate > 10 ? 'critical' : 'degraded';
      }

      return {
        ...dep,
        avgLatency: latency,
        errorRate,
        status: linkStatus,
        callCount: dep.callRate ? Math.round(dep.callRate * 60) : 10,
      };
    });

    return NextResponse.json({ nodes, links });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
