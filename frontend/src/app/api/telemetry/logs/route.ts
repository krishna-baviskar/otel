import { NextRequest, NextResponse } from 'next/server';
import { getLiveLogs } from '@/lib/live-traffic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service') ?? undefined;
    const level = searchParams.get('level') ?? undefined;
    const search = searchParams.get('search') ?? undefined;
    const traceId = searchParams.get('traceId') ?? undefined;
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);

    const logs = getLiveLogs({ service, level, search, traceId, limit });

    return NextResponse.json({
      total: logs.length,
      logs,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
