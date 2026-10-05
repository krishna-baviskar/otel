import { NextRequest, NextResponse } from 'next/server';
import { DqlQueryResult } from '@/types/telemetry';
import { getCorrelatedLogs, getSampleTraces } from '@/lib/telemetry-service';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { query } = await request.json();
    const cleanQuery = (query || '').trim();

    // Check if Dynatrace credentials exist
    const hasDynatrace = Boolean(process.env.DT_TENANT_BASEURL && process.env.DT_TOKEN);

    if (hasDynatrace) {
      try {
        const dtRes = await fetch(`${process.env.DT_TENANT_BASEURL}/platform/storage/query/v1/query:execute`, {
          method: 'POST',
          headers: {
            Authorization: `Api-Token ${process.env.DT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: cleanQuery }),
        });
        if (dtRes.ok) {
          const dtJson = await dtRes.json();
          return NextResponse.json({
            query: cleanQuery,
            executionTimeMs: Date.now() - startTime,
            source: 'LIVE DYNATRACE',
            columns: dtJson.types?.map((t: { name: string }) => t.name) || ['record'],
            records: dtJson.result?.records || [],
            totalRecords: dtJson.result?.records?.length || 0,
          });
        }
      } catch {
        // Fallback to local DQL evaluator
      }
    }

    // Local / Demo DQL Evaluator
    let columns: string[] = ['timestamp', 'service.name', 'content'];
    let records: Record<string, unknown>[] = [];

    const lowerQuery = cleanQuery.toLowerCase();

    if (lowerQuery.includes('fetch spans')) {
      const traces = getSampleTraces();
      columns = ['timestamp', 'service.name', 'span.name', 'duration.ms', 'status.code', 'trace_id'];
      records = traces.map(t => ({
        timestamp: t.startTime,
        'service.name': t.rootServiceName,
        'span.name': t.rootOperationName,
        'duration.ms': t.durationMs,
        'status.code': t.statusCode,
        trace_id: t.traceId,
      }));
    } else if (lowerQuery.includes('fetch logs')) {
      const logs = getCorrelatedLogs();
      columns = ['timestamp', 'level', 'service.name', 'content', 'trace_id'];
      records = logs.map(l => ({
        timestamp: l.timestamp,
        level: l.level,
        'service.name': l.service,
        content: l.message,
        trace_id: l.traceId || '-',
      }));
    } else if (lowerQuery.includes('timeseries')) {
      columns = ['timeframe', 'service.name', 'avg_latency_ms', 'req_per_sec'];
      records = [
        { timeframe: 'now-15m', 'service.name': 'backend', avg_latency_ms: 778.2, req_per_sec: 4.8 },
        { timeframe: 'now-10m', 'service.name': 'mail-service', avg_latency_ms: 746.5, req_per_sec: 4.8 },
        { timeframe: 'now-5m', 'service.name': 'template-service', avg_latency_ms: 42.1, req_per_sec: 4.8 },
        { timeframe: 'now', 'service.name': 'backend', avg_latency_ms: 765.0, req_per_sec: 5.1 },
      ];
    } else {
      // General overview
      columns = ['service.name', 'status', 'protocol', 'monitored_by'];
      records = [
        { 'service.name': 'backend', status: 'healthy', protocol: 'HTTP', monitored_by: 'OneAgent + OTel' },
        { 'service.name': 'mail-service', status: 'healthy', protocol: 'HTTP', monitored_by: 'OpenTelemetry only' },
        { 'service.name': 'template-service', status: 'healthy', protocol: 'gRPC', monitored_by: 'OneAgent' },
        { 'service.name': 'mongodb', status: 'healthy', protocol: 'TCP', monitored_by: 'OTel MongoDB' },
        { 'service.name': 'redis', status: 'healthy', protocol: 'TCP', monitored_by: 'OTel IORedis' },
      ];
    }

    const result: DqlQueryResult = {
      query: cleanQuery,
      executionTimeMs: Math.max(Date.now() - startTime, 18),
      source: 'DEMO DATA',
      columns,
      records,
      totalRecords: records.length,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
