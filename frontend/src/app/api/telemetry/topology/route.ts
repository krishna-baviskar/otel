import { NextResponse } from 'next/server';
import { getLiveSystemStatus } from '@/lib/telemetry-service';
import { INITIAL_DEPENDENCIES } from '@/lib/constants';
import { getSimulationState } from '@/lib/simulation-store';

export async function GET() {
  try {
    const status = await getLiveSystemStatus();
    const sim = getSimulationState();

    const nodes = Object.values(status.services);

    const edges = INITIAL_DEPENDENCIES.map(dep => {
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
      };
    });

    return NextResponse.json({
      nodes,
      edges,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
