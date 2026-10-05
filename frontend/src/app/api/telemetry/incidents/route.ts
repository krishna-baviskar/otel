import { NextResponse } from 'next/server';
import { getSimulationState } from '@/lib/simulation-store';
import { Incident } from '@/types/telemetry';

export async function GET() {
  try {
    const sim = getSimulationState();
    const incidents: Incident[] = [];

    if (sim.active && sim.incident) {
      incidents.push(sim.incident);
    }

    return NextResponse.json({
      total: incidents.length,
      incidents,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
