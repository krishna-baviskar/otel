import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { getLiveTraces } from '@/lib/live-traffic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceFilter = searchParams.get('service') ?? undefined;
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  try {
    const traces = getLiveTraces(serviceFilter, limit);
    return NextResponse.json(traces);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
