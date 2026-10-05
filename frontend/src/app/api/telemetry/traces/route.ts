import { NextResponse } from 'next/server';
import { getSampleTraces } from '@/lib/telemetry-service';

export async function GET() {
  try {
    const traces = getSampleTraces();
    return NextResponse.json(traces);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
