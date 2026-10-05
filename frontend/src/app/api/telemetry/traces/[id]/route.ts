import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveTraceFromTempo, getSampleWaterfallSpans } from '@/lib/telemetry-service';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Attempt to query Tempo first
    const liveSpans = await fetchLiveTraceFromTempo(id);
    if (liveSpans && liveSpans.length > 0) {
      return NextResponse.json({
        traceId: id,
        source: 'LIVE TEMPO',
        spans: liveSpans,
      });
    }

    // Fallback to sample waterfall spans
    const sampleSpans = getSampleWaterfallSpans(id);
    return NextResponse.json({
      traceId: id,
      source: 'LOCAL SAMPLE',
      spans: sampleSpans,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
