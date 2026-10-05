import {
  SystemStatus,
  ServiceNode,
  TraceSpan,
  TraceSummary,
  MetricSeries,
  LogRecord,
  Incident,
  DqlQueryResult,
} from '../types/telemetry';
import { SERVICES_CONFIG } from './constants';
import { getSimulationState } from './simulation-store';

export async function fetchCollectorMetrics(): Promise<{
  acceptedSpans: number;
  sentSpans: number;
  uptimeSeconds: number;
  cpuSeconds: number;
  memoryBytes: number;
  healthy: boolean;
}> {
  try {
    const res = await fetch('http://localhost:8888/metrics', { next: { revalidate: 2 } });
    if (!res.ok) throw new Error('Collector metrics returned ' + res.status);
    const text = await res.text();

    const parseMetric = (regex: RegExp, def: number = 0): number => {
      const match = text.match(regex);
      return match && match[1] ? parseFloat(match[1]) : def;
    };

    const acceptedSpans = parseMetric(/otelcol_receiver_accepted_spans\{[^}]*\}\s+([0-9.]+)/, 78);
    const sentSpans = parseMetric(/otelcol_exporter_sent_spans\{[^}]*\}\s+([0-9.]+)/, 78);
    const uptimeSeconds = parseMetric(/otelcol_process_uptime\s+([0-9.]+)/, 15000);
    const cpuSeconds = parseMetric(/otelcol_process_cpu_seconds\{[^}]*\}\s+([0-9.]+)/, 9.9);
    const memoryBytes = parseMetric(/otelcol_process_memory_rss\{[^}]*\}\s+([0-9.e+]+)/, 62000000);

    return {
      acceptedSpans,
      sentSpans,
      uptimeSeconds,
      cpuSeconds,
      memoryBytes,
      healthy: true,
    };
  } catch {
    return {
      acceptedSpans: 124,
      sentSpans: 124,
      uptimeSeconds: 18400,
      cpuSeconds: 12.4,
      memoryBytes: 64200000,
      healthy: false,
    };
  }
}

export async function getLiveSystemStatus(): Promise<SystemStatus> {
  const collector = await fetchCollectorMetrics();
  const sim = getSimulationState();

  // Test service health
  const checkService = async (url: string): Promise<boolean> => {
    try {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), 800);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(id);
      return res.status < 500;
    } catch {
      return false;
    }
  };

  const [backendUp, mailUp, grafanaUp] = await Promise.all([
    checkService('http://localhost:4000/users/me@martinnirtl.com'),
    checkService('http://localhost:4100/status/test'),
    checkService('http://localhost:3000/api/health'),
  ]);

  const isLocalLive = backendUp || collector.healthy || grafanaUp;

  // Build services map
  const services: Record<string, ServiceNode> = {};
  for (const [key, base] of Object.entries(SERVICES_CONFIG)) {
    let status: ServiceNode['status'] = 'healthy';
    let requestRate = 5.2;
    let errorRate = 0.0;
    let avgLatency = 45;
    let p95Latency = 120;
    let activeConnections = 3;

    if (key === 'backend') {
      status = backendUp ? 'healthy' : 'degraded';
      avgLatency = 770;
      p95Latency = 850;
      activeConnections = 12;
    } else if (key === 'mail-service') {
      status = mailUp ? 'healthy' : 'degraded';
      avgLatency = 740;
      p95Latency = 810;
    } else if (key === 'template-service') {
      avgLatency = 38;
      p95Latency = 65;
    } else if (key === 'mongodb') {
      avgLatency = 3.5;
      p95Latency = 8.0;
    } else if (key === 'redis') {
      avgLatency = 2.2;
      p95Latency = 4.8;
    } else if (key === 'external-mail') {
      avgLatency = 680;
      p95Latency = 720;
    }

    // Apply simulation state if active
    if (sim.active && sim.affectedService === key) {
      status = sim.errorRate > 15 ? 'critical' : 'degraded';
      avgLatency = Math.round(avgLatency * sim.latencyMultiplier);
      p95Latency = Math.round(p95Latency * sim.latencyMultiplier * 1.3);
      errorRate = sim.errorRate;
    } else if (sim.active && sim.affectedService === 'redis' && (key === 'mail-service' || key === 'template-service')) {
      // Cascading effect
      avgLatency = Math.round(avgLatency * 1.8);
      p95Latency = Math.round(p95Latency * 2.2);
    }

    services[key] = {
      ...base,
      status,
      requestRate,
      errorRate,
      avgLatency,
      p95Latency,
      activeConnections,
    };
  }

  const dynatraceConfigured = Boolean(process.env.DT_TENANT_BASEURL && process.env.DT_TOKEN);

  return {
    mode: isLocalLive ? 'LOCAL' : 'DEMO',
    environment: 'Local Docker',
    openTelemetry: {
      status: collector.healthy ? 'Healthy' : 'Degraded',
      collectorEndpoint: 'grpc://localhost:4317',
      metricsEndpoint: 'http://localhost:8888/metrics',
      acceptedSpans: collector.acceptedSpans,
      sentSpans: collector.sentSpans,
      uptimeSeconds: Math.round(collector.uptimeSeconds),
      cpuSeconds: collector.cpuSeconds,
      memoryBytes: collector.memoryBytes,
    },
    dynatrace: {
      connected: dynatraceConfigured,
      tenantUrl: process.env.DT_TENANT_BASEURL,
      statusText: dynatraceConfigured ? 'Connected to Tenant' : 'Demo Mode — Dynatrace credentials not configured',
      mode: dynatraceConfigured ? 'Active' : 'Demo Mode',
    },
    services,
    activeIncidentsCount: sim.active ? 1 : 0,
    lastUpdated: new Date().toISOString(),
  };
}

export async function fetchLiveTraceFromTempo(traceId: string): Promise<TraceSpan[] | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/datasources/proxy/1/api/traces/${traceId}`, {
      next: { revalidate: 2 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.batches || !Array.isArray(json.batches)) return null;

    const spans: TraceSpan[] = [];

    for (const batch of json.batches) {
      const serviceName =
        batch.resource?.attributes?.find((a: { key: string }) => a.key === 'service.name')?.value?.stringValue ||
        'unknown-service';

      if (batch.instrumentationLibrarySpans) {
        for (const lib of batch.instrumentationLibrarySpans) {
          if (lib.spans) {
            for (const s of lib.spans) {
              const startMs = Math.round(s.startTimeUnixNano / 1e6);
              const durationMs = Math.round(((s.endTimeUnixNano - s.startTimeUnixNano) / 1e6) * 100) / 100;

              const attributes: Record<string, string | number | boolean> = {};
              if (s.attributes) {
                for (const attr of s.attributes) {
                  const val = attr.value;
                  attributes[attr.key] = val.stringValue ?? val.intValue ?? val.boolValue ?? JSON.stringify(val);
                }
              }

              const events = (s.events || []).map((e: { name: string; timeUnixNano: number }) => ({
                name: e.name,
                timestamp: Math.round(e.timeUnixNano / 1e6),
              }));

              spans.push({
                id: s.spanId,
                traceId: s.traceId || traceId,
                parentId: s.parentSpanId || undefined,
                name: s.name,
                serviceName,
                kind: s.kind || 'INTERNAL',
                startTimeMs: startMs,
                durationMs: Math.max(durationMs, 0.05),
                statusCode: s.status?.code === 1 ? 'OK' : s.status?.code === 2 ? 'ERROR' : 'OK',
                statusMessage: s.status?.message,
                attributes,
                events,
              });
            }
          }
        }
      }
    }

    if (spans.length === 0) return null;

    // Normalize start times relative to root
    const minStart = Math.min(...spans.map(s => s.startTimeMs));
    spans.forEach(s => {
      s.startTimeMs = s.startTimeMs - minStart;
    });

    // Sort chronologically
    spans.sort((a, b) => a.startTimeMs - b.startTimeMs);
    return spans;
  } catch {
    return null;
  }
}

export function getSampleTraces(): TraceSummary[] {
  return [
    {
      traceId: '297a81485219144231b82695cd266b5d',
      rootServiceName: 'backend',
      rootOperationName: 'POST /signup',
      startTime: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      timestampMs: Date.now() - 1000 * 60 * 3,
      durationMs: 778.76,
      spanCount: 30,
      errorCount: 0,
      services: ['backend', 'mail-service', 'template-service', 'mongodb', 'redis'],
      statusCode: 'OK',
    },
    {
      traceId: '7763e7594a2172adc8fff1eb6c457bdd',
      rootServiceName: 'backend',
      rootOperationName: 'POST /signup',
      startTime: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      timestampMs: Date.now() - 1000 * 60 * 12,
      durationMs: 812.4,
      spanCount: 29,
      errorCount: 0,
      services: ['backend', 'mail-service', 'template-service', 'mongodb', 'redis'],
      statusCode: 'OK',
    },
    {
      traceId: '95044d199e5e1e32f009e7f67150ba3e',
      rootServiceName: 'backend',
      rootOperationName: 'POST /signup',
      startTime: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      timestampMs: Date.now() - 1000 * 60 * 25,
      durationMs: 754.2,
      spanCount: 28,
      errorCount: 0,
      services: ['backend', 'mail-service', 'template-service'],
      statusCode: 'OK',
    },
    {
      traceId: 'e49a19c72e814bf3910ab385710294da',
      rootServiceName: 'backend',
      rootOperationName: 'POST /signup',
      startTime: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      timestampMs: Date.now() - 1000 * 60 * 42,
      durationMs: 2.14,
      spanCount: 6,
      errorCount: 1,
      services: ['backend'],
      statusCode: 'ERROR',
    },
  ];
}

export function getSampleWaterfallSpans(traceId: string): TraceSpan[] {
  return [
    {
      id: 'span-root',
      traceId,
      name: 'POST /signup',
      serviceName: 'backend',
      kind: 'SERVER',
      startTimeMs: 0,
      durationMs: 778.76,
      statusCode: 'OK',
      attributes: {
        'http.method': 'POST',
        'http.route': '/signup',
        'http.status_code': 200,
        'http.target': '/signup',
      },
      events: [{ name: 'request received', timestamp: 0 }],
      depth: 0,
    },
    {
      id: 'span-val',
      traceId,
      parentId: 'span-root',
      name: 'validate email',
      serviceName: 'backend',
      kind: 'INTERNAL',
      startTimeMs: 2.5,
      durationMs: 2.07,
      statusCode: 'OK',
      attributes: { 'app.user.email': 'user@example.com', 'validation.rule': 'regex' },
      events: [{ name: 'email validated', timestamp: 4 }],
      depth: 1,
    },
    {
      id: 'span-mongo',
      traceId,
      parentId: 'span-root',
      name: 'backend.users.insertOne',
      serviceName: 'mongodb',
      kind: 'CLIENT',
      startTimeMs: 5.2,
      durationMs: 12.8,
      statusCode: 'OK',
      attributes: { 'db.system': 'mongodb', 'db.name': 'backend', 'db.mongodb.collection': 'users' },
      events: [],
      depth: 1,
    },
    {
      id: 'span-sendmail-wrap',
      traceId,
      parentId: 'span-root',
      name: 'sending email',
      serviceName: 'backend',
      kind: 'INTERNAL',
      startTimeMs: 18.7,
      durationMs: 759.98,
      statusCode: 'OK',
      attributes: { 'app.user.email': 'user@example.com' },
      events: [{ name: 'payload built', timestamp: 20 }],
      depth: 1,
    },
    {
      id: 'span-callmail',
      traceId,
      parentId: 'span-sendmail-wrap',
      name: 'calling mail-service',
      serviceName: 'backend',
      kind: 'CLIENT',
      startTimeMs: 22.0,
      durationMs: 756.04,
      statusCode: 'OK',
      attributes: { 'app.mail-service': 'http://mail-service:4100/send', 'http.method': 'POST' },
      events: [],
      depth: 2,
    },
    {
      id: 'span-mail-ingress',
      traceId,
      parentId: 'span-callmail',
      name: 'POST /send',
      serviceName: 'mail-service',
      kind: 'SERVER',
      startTimeMs: 24.5,
      durationMs: 746.81,
      statusCode: 'OK',
      attributes: { 'http.status_code': 200, 'w3c.traceparent': '00-trace-span-01' },
      events: [],
      depth: 3,
    },
    {
      id: 'span-rendertpl-wrap',
      traceId,
      parentId: 'span-mail-ingress',
      name: 'render template',
      serviceName: 'mail-service',
      kind: 'INTERNAL',
      startTimeMs: 28.0,
      durationMs: 43.26,
      statusCode: 'OK',
      attributes: { 'app.template.name': 'user.signup' },
      events: [],
      depth: 4,
    },
    {
      id: 'span-grpc-client',
      traceId,
      parentId: 'span-rendertpl-wrap',
      name: 'grpc.templateservice.TemplateService/render',
      serviceName: 'mail-service',
      kind: 'CLIENT',
      startTimeMs: 29.2,
      durationMs: 42.0,
      statusCode: 'OK',
      attributes: { 'rpc.system': 'grpc', 'rpc.service': 'TemplateService', 'rpc.method': 'render' },
      events: [],
      depth: 5,
    },
    {
      id: 'span-grpc-server',
      traceId,
      parentId: 'span-grpc-client',
      name: 'grpc.templateservice.TemplateService/render',
      serviceName: 'template-service',
      kind: 'SERVER',
      startTimeMs: 31.0,
      durationMs: 21.47,
      statusCode: 'OK',
      attributes: { 'template.name': 'user.signup', 'template.lang': 'en' },
      events: [],
      depth: 6,
    },
    {
      id: 'span-redis-get',
      traceId,
      parentId: 'span-grpc-server',
      name: 'redis.get (cache lookup)',
      serviceName: 'redis',
      kind: 'CLIENT',
      startTimeMs: 33.2,
      durationMs: 4.09,
      statusCode: 'OK',
      attributes: { 'db.system': 'redis', 'db.redis.database_index': 2, 'db.operation': 'get' },
      events: [],
      depth: 7,
    },
    {
      id: 'span-delivermail-wrap',
      traceId,
      parentId: 'span-mail-ingress',
      name: 'deliver mail',
      serviceName: 'mail-service',
      kind: 'INTERNAL',
      startTimeMs: 75.0,
      durationMs: 684.64,
      statusCode: 'OK',
      attributes: { 'app.mail.external': 'https://httpbin.org/anything' },
      events: [],
      depth: 4,
    },
    {
      id: 'span-external-http',
      traceId,
      parentId: 'span-delivermail-wrap',
      name: 'POST https://httpbin.org/anything',
      serviceName: 'external-mail',
      kind: 'CLIENT',
      startTimeMs: 77.1,
      durationMs: 681.33,
      statusCode: 'OK',
      attributes: { 'http.status_code': 200, 'http.url': 'https://httpbin.org/anything' },
      events: [],
      depth: 5,
    },
    {
      id: 'span-redis-setex',
      traceId,
      parentId: 'span-mail-ingress',
      name: 'redis.setex (record delivery)',
      serviceName: 'redis',
      kind: 'CLIENT',
      startTimeMs: 760.0,
      durationMs: 5.96,
      statusCode: 'OK',
      attributes: { 'db.system': 'redis', 'db.redis.database_index': 1, 'db.operation': 'setex' },
      events: [],
      depth: 4,
    },
  ];
}

export function generateTimeSeriesMetrics(minutes: number = 30): MetricSeries[] {
  const points: MetricSeries[] = [];
  const now = Date.now();
  const sim = getSimulationState();

  for (let i = minutes; i >= 0; i--) {
    const timeMs = now - i * 60 * 1000;
    const date = new Date(timeMs);
    const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let rps = 4.5 + Math.sin(i / 3) * 1.2 + (Math.random() * 0.4 - 0.2);
    let avg = 45 + Math.cos(i / 4) * 8 + (Math.random() * 4 - 2);
    let errorRate = 0.02 + Math.random() * 0.05;

    // Simulate incident anomaly in the last 10 minutes if simulation is active
    if (sim.active && i <= 10) {
      rps = Math.max(rps * 0.7, 1.2);
      avg = avg * sim.latencyMultiplier;
      errorRate = sim.errorRate;
    }

    points.push({
      timestamp: date.toISOString(),
      timeLabel,
      requestsPerSec: Math.round(rps * 10) / 10,
      errorRate: Math.round(errorRate * 10) / 10,
      latencyAvg: Math.round(avg),
      latencyP50: Math.round(avg * 0.8),
      latencyP95: Math.round(avg * 1.6),
      latencyP99: Math.round(avg * 2.4),
      cpuPercent: Math.round((14 + Math.sin(i / 2) * 5 + (sim.active ? 28 : 0)) * 10) / 10,
      memoryMb: Math.round(380 + i * 0.8 + (sim.active ? 120 : 0)),
      redisOpsPerSec: Math.round((18 + Math.cos(i / 2) * 4) * 10) / 10,
      mongoLatencyMs: Math.round((3.2 + Math.random() * 0.8) * 10) / 10,
    });
  }

  return points;
}

export function getCorrelatedLogs(): LogRecord[] {
  return [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
      level: 'info',
      service: 'backend',
      message: 'listening on port 4000',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
      level: 'debug',
      service: 'backend',
      message: 'signing up new user',
      traceId: '297a81485219144231b82695cd266b5d',
      spanId: 'f27e9892a7f766b6',
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 1000 * 29).toISOString(),
      level: 'info',
      service: 'backend',
      message: 'created new user in mongo collection users',
      traceId: '297a81485219144231b82695cd266b5d',
    },
    {
      id: 'log-4',
      timestamp: new Date(Date.now() - 1000 * 28).toISOString(),
      level: 'info',
      service: 'mail-service',
      message: 'processing mail payload for signup confirmation',
      traceId: '297a81485219144231b82695cd266b5d',
      spanId: 'dbf8967bc8dbe005',
    },
    {
      id: 'log-5',
      timestamp: new Date(Date.now() - 1000 * 27).toISOString(),
      level: 'info',
      service: 'mail-service',
      message: 'calling template-service to render user.signup text over gRPC',
      traceId: '297a81485219144231b82695cd266b5d',
      spanId: '6057d4e6d1e394f2',
    },
    {
      id: 'log-6',
      timestamp: new Date(Date.now() - 1000 * 26).toISOString(),
      level: 'info',
      service: 'template-service',
      message: 'cached rendered template user.signup in Redis DB 2 (TTL: 86400s)',
      traceId: '297a81485219144231b82695cd266b5d',
    },
    {
      id: 'log-7',
      timestamp: new Date(Date.now() - 1000 * 25).toISOString(),
      level: 'info',
      service: 'mail-service',
      message: 'mail payload sent to external provider httpbin.org, response 200 OK',
      traceId: '297a81485219144231b82695cd266b5d',
      spanId: '71f3cb80f4fd88a9',
    },
    {
      id: 'log-8',
      timestamp: new Date(Date.now() - 1000 * 24).toISOString(),
      level: 'info',
      service: 'backend',
      message: 'POST /signup completed with status 200 OK in 778ms',
      traceId: '297a81485219144231b82695cd266b5d',
    },
  ];
}
