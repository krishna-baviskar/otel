import { NextRequest, NextResponse } from 'next/server';
import { executeLiveRequest, getTrafficGeneratorStats, setAutoTraffic } from '@/lib/live-traffic';

export async function GET() {
  const stats = getTrafficGeneratorStats();
  return NextResponse.json(stats);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'trigger';
    const type = body.type || 'signup';

    if (action === 'toggle_auto') {
      const enabled = Boolean(body.enabled);
      setAutoTraffic(enabled);
      return NextResponse.json({
        success: true,
        message: `Auto-traffic generator is now ${enabled ? 'ENABLED' : 'DISABLED'}`,
        stats: getTrafficGeneratorStats(),
      });
    }

    // Trigger a single real request
    const record = await executeLiveRequest(type);

    return NextResponse.json({
      success: true,
      traceId: record.traceId,
      rootOperationName: record.rootOperationName,
      durationMs: record.durationMs,
      statusCode: record.statusCode,
      services: record.services,
      message: `Real transaction executed: ${record.rootOperationName} across ${record.services.length} microservices in ${record.durationMs}ms`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
