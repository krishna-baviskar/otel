import { NextRequest, NextResponse } from 'next/server';
import { getSampleWaterfallSpans } from '@/lib/telemetry-service';
import { TraceDetail, Span } from '@/types/telemetry';

function base64ToHex(b64: string): string {
  try {
    return Buffer.from(b64, 'base64').toString('hex');
  } catch {
    return b64;
  }
}

async function fetchFromTempo(traceId: string): Promise<TraceDetail | null> {
  try {
    const res = await fetch(`http://localhost:3200/api/traces/${traceId}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.batches || !Array.isArray(json.batches) || json.batches.length === 0) return null;

    interface RawSpan {
      id: string;
      parentId?: string;
      name: string;
      serviceName: string;
      kind: 'CLIENT' | 'SERVER' | 'INTERNAL' | 'PRODUCER' | 'CONSUMER';
      startMs: number;
      endMs: number;
      duration: number;
      status: { code: string; message?: string };
      attributes: Record<string, any>;
      events: Array<{ name: string; timestamp: number }>;
    }

    const rawSpans: RawSpan[] = [];

    for (const batch of json.batches) {
      const serviceName =
        batch.resource?.attributes?.find((a: any) => a.key === 'service.name')?.value?.stringValue ||
        'backend';

      for (const lib of batch.instrumentationLibrarySpans || []) {
        for (const s of lib.spans || []) {
          const spanId = base64ToHex(s.spanId);
          const parentId = s.parentSpanId ? base64ToHex(s.parentSpanId) : undefined;

          // Convert string nanoseconds to ms
          const startMs = s.startTimeUnixNano
            ? Number(BigInt(s.startTimeUnixNano) / 1000000n)
            : Date.now();
          const endMs = s.endTimeUnixNano
            ? Number(BigInt(s.endTimeUnixNano) / 1000000n)
            : startMs + 1;
          const duration = Math.max(0.05, Math.round((endMs - startMs) * 100) / 100);

          // Attributes
          const attributes: Record<string, any> = {};
          if (Array.isArray(s.attributes)) {
            for (const attr of s.attributes) {
              const val = attr.value;
              if (val) {
                attributes[attr.key] =
                  val.stringValue ?? val.intValue ?? val.boolValue ?? JSON.stringify(val);
              }
            }
          }

          // Events
          const events = (s.events || []).map((e: any) => ({
            name: e.name || 'event',
            timestamp: e.timeUnixNano ? Number(BigInt(e.timeUnixNano) / 1000000n) : 0,
          }));

          // Status
          const statusCode =
            s.status?.code === 2 || s.status?.code === 'STATUS_CODE_ERROR'
              ? 'ERROR'
              : 'OK';

          const kindStr = (s.kind || '').replace('SPAN_KIND_', '');
          const kind = (['CLIENT', 'SERVER', 'INTERNAL', 'PRODUCER', 'CONSUMER'].includes(kindStr)
            ? kindStr
            : 'INTERNAL') as any;

          rawSpans.push({
            id: spanId,
            parentId,
            name: s.name || 'unnamed-span',
            serviceName,
            kind,
            startMs,
            endMs,
            duration,
            status: { code: statusCode, message: s.status?.message },
            attributes,
            events,
          });
        }
      }
    }

    if (rawSpans.length === 0) return null;

    // Compute min start time to normalize
    const minStartMs = Math.min(...rawSpans.map((s) => s.startMs));
    const maxEndMs = Math.max(...rawSpans.map((s) => s.endMs));
    const totalDuration = Math.max(1, maxEndMs - minStartMs);

    // Build parent-to-depth map
    const spanMap = new Map<string, RawSpan>();
    rawSpans.forEach((s) => spanMap.set(s.id, s));

    const computeDepth = (span: RawSpan, visited = new Set<string>()): number => {
      if (!span.parentId || visited.has(span.id)) return 0;
      visited.add(span.id);
      const parent = spanMap.get(span.parentId);
      if (!parent) return 0;
      return 1 + computeDepth(parent, visited);
    };

    // Sort chronologically by start time
    rawSpans.sort((a, b) => a.startMs - b.startMs);

    const spans: Span[] = rawSpans.map((s) => {
      const startTime = s.startMs - minStartMs;
      const endTime = s.endMs - minStartMs;
      return {
        id: s.id,
        traceId,
        parentId: s.parentId,
        name: s.name,
        serviceName: s.serviceName,
        kind: s.kind,
        startTime,
        endTime,
        duration: s.duration,
        depth: computeDepth(s),
        status: s.status as any,
        attributes: s.attributes,
        events: s.events,
      };
    });

    const rootSpan = spans.find((s) => !s.parentId) || spans[0];
    const services = [...new Set(spans.map((s) => s.serviceName))];
    const hasErrors = spans.some((s) => s.status.code === 'ERROR');

    return {
      id: traceId,
      rootOperation: rootSpan ? `${rootSpan.name}` : 'POST /signup',
      hasErrors,
      source: 'tempo',
      duration: Math.round(totalDuration * 100) / 100,
      spanCount: spans.length,
      services,
      timestamp: new Date(minStartMs).toISOString(),
      spans,
    };
  } catch (err) {
    console.warn(`[Tempo] Failed to parse trace ${traceId}:`, (err as Error).message);
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Try real Tempo trace first
    const tempoDetail = await fetchFromTempo(id);
    if (tempoDetail) {
      return NextResponse.json(tempoDetail);
    }

    // 2. Fallback to sample waterfall spans and format properly as TraceDetail
    const rawSampleSpans = getSampleWaterfallSpans(id);
    const services = [...new Set(rawSampleSpans.map((s) => s.serviceName))];
    const hasErrors = rawSampleSpans.some((s) => s.statusCode === 'ERROR');

    const spans: Span[] = rawSampleSpans.map((s) => {
      const startTime = s.startTimeMs;
      const duration = s.durationMs;
      const endTime = startTime + duration;
      return {
        id: s.id,
        traceId: id,
        parentId: s.parentId,
        name: s.name,
        serviceName: s.serviceName,
        kind: s.kind,
        startTime,
        endTime,
        duration,
        depth: s.depth ?? 0,
        status: {
          code: s.statusCode,
          message: s.statusMessage,
        },
        attributes: s.attributes || {},
        events: s.events || [],
      };
    });

    const maxEnd = Math.max(...spans.map((s) => s.endTime), 1);
    const rootSpan = spans.find((s) => !s.parentId) || spans[0];

    const fallbackDetail: TraceDetail = {
      id,
      rootOperation: rootSpan?.name || 'POST /signup',
      hasErrors,
      source: 'local',
      duration: Math.round(maxEnd * 100) / 100,
      spanCount: spans.length,
      services,
      timestamp: new Date().toISOString(),
      spans,
    };

    return NextResponse.json(fallbackDetail);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
