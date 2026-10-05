import { NextRequest, NextResponse } from 'next/server';
import { getCorrelatedLogs } from '@/lib/telemetry-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const level = searchParams.get('level');
    const search = searchParams.get('search')?.toLowerCase();
    const traceId = searchParams.get('traceId');

    let logs = getCorrelatedLogs();

    if (service && service !== 'all') {
      logs = logs.filter(l => l.service === service);
    }
    if (level && level !== 'all') {
      logs = logs.filter(l => l.level === level);
    }
    if (traceId) {
      logs = logs.filter(l => l.traceId === traceId);
    }
    if (search) {
      logs = logs.filter(l => l.message.toLowerCase().includes(search) || l.service.toLowerCase().includes(search));
    }

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
