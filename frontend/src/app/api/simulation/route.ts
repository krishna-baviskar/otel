import { NextRequest, NextResponse } from 'next/server';
import { getSimulationState, startSimulation, stopSimulation, SimulationState } from '@/lib/simulation-store';

export async function GET() {
  return NextResponse.json(getSimulationState());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'toggle';
    const scenario: SimulationState['scenario'] = body.scenario || 'redis_slowdown';

    const current = getSimulationState();

    let updated: SimulationState;
    if (action === 'start') {
      updated = startSimulation(scenario);
    } else if (action === 'stop') {
      updated = stopSimulation();
    } else {
      // toggle
      updated = current.active ? stopSimulation() : startSimulation(scenario);
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
