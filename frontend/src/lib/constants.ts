import { ServiceNode, DependencyLink } from '../types/telemetry';

export const SERVICES_CONFIG: Record<string, Omit<ServiceNode, 'status' | 'requestRate' | 'errorRate' | 'avgLatency' | 'p95Latency' | 'activeConnections'>> = {
  backend: {
    id: 'backend',
    name: 'Backend Service',
    type: 'service',
    technology: 'Node.js / Express',
    instances: 1,
    description: 'REST API entrypoint handling user signup validation and orchestrating downstream delivery',
    monitoredBy: 'OneAgent',
    port: 4000,
    url: 'http://localhost:4000',
  },
  'mail-service': {
    id: 'mail-service',
    name: 'Mail Service',
    type: 'service',
    technology: 'Node.js / Express',
    instances: 1,
    description: 'Email coordinator invoking gRPC template rendering, caching in Redis, and external dispatch',
    monitoredBy: 'OpenTelemetry',
    port: 4100,
    url: 'http://localhost:4100',
  },
  'template-service': {
    id: 'template-service',
    name: 'Template Service',
    type: 'service',
    technology: 'Node.js / gRPC',
    instances: 1,
    description: 'High-performance microservice rendering localized email templates over gRPC',
    monitoredBy: 'OneAgent',
    port: 4200,
    url: 'localhost:4200',
  },
  mongodb: {
    id: 'mongodb',
    name: 'MongoDB Database',
    type: 'database',
    technology: 'MongoDB 5.0',
    instances: 1,
    description: 'Primary user datastore preserving registered accounts in the `backend.users` collection',
    monitoredBy: 'OpenTelemetry',
    port: 27017,
  },
  redis: {
    id: 'redis',
    name: 'Redis Cache',
    type: 'cache',
    technology: 'Redis 5.0',
    instances: 1,
    description: 'Dual-database in-memory store: DB 1 (delivery statuses) & DB 2 (rendered template cache)',
    monitoredBy: 'OpenTelemetry',
    port: 6379,
  },
  'external-mail': {
    id: 'external-mail',
    name: 'External Mail Provider',
    type: 'external',
    technology: 'HTTP REST (httpbin.org)',
    instances: 1,
    description: 'Simulated 3rd-party SaaS email delivery platform (Sendgrid/Mailgun mock endpoint)',
    monitoredBy: 'OpenTelemetry',
  },
  'otel-collector': {
    id: 'otel-collector',
    name: 'OpenTelemetry Collector',
    type: 'collector',
    technology: 'OpenTelemetry Collector 0.43.0',
    instances: 1,
    description: 'Central pipeline ingesting OTLP gRPC telemetry on 4317 and exporting to Tempo and Dynatrace',
    monitoredBy: 'Native',
    port: 4317,
    url: 'http://localhost:8888',
  },
};

export const INITIAL_DEPENDENCIES: DependencyLink[] = [
  {
    id: 'client->backend',
    source: 'client',
    target: 'backend',
    protocol: 'HTTP',
    callRate: 4.8,
    avgLatency: 780,
    errorRate: 0.0,
    status: 'healthy',
  },
  {
    id: 'backend->mongodb',
    source: 'backend',
    target: 'mongodb',
    protocol: 'TCP',
    callRate: 4.8,
    avgLatency: 3.2,
    errorRate: 0.0,
    status: 'healthy',
  },
  {
    id: 'backend->mail-service',
    source: 'backend',
    target: 'mail-service',
    protocol: 'HTTP',
    callRate: 4.8,
    avgLatency: 750,
    errorRate: 0.0,
    status: 'healthy',
  },
  {
    id: 'mail-service->template-service',
    source: 'mail-service',
    target: 'template-service',
    protocol: 'gRPC',
    callRate: 4.8,
    avgLatency: 42,
    errorRate: 0.0,
    status: 'healthy',
  },
  {
    id: 'template-service->redis',
    source: 'template-service',
    target: 'redis',
    protocol: 'TCP',
    callRate: 9.6,
    avgLatency: 2.1,
    errorRate: 0.0,
    status: 'healthy',
  },
  {
    id: 'mail-service->redis',
    source: 'mail-service',
    target: 'redis',
    protocol: 'TCP',
    callRate: 4.8,
    avgLatency: 2.4,
    errorRate: 0.0,
    status: 'healthy',
  },
  {
    id: 'mail-service->external-mail',
    source: 'mail-service',
    target: 'external-mail',
    protocol: 'HTTP',
    callRate: 4.8,
    avgLatency: 680,
    errorRate: 0.0,
    status: 'healthy',
  },
  {
    id: 'services->otel-collector',
    source: 'backend',
    target: 'otel-collector',
    protocol: 'OTLP',
    callRate: 15.2,
    avgLatency: 1.1,
    errorRate: 0.0,
    status: 'healthy',
  },
];

export const SAMPLE_DQL_QUERIES = [
  {
    name: 'Top Slow Spans',
    query: `fetch spans
| filter isNotNull(duration)
| sort duration desc
| limit 10
| fields timestamp, service.name, span.name, duration, status.code`,
    description: 'Fetch the 10 longest spans across all microservices to isolate latency bottlenecks.',
  },
  {
    name: 'Service Latency by Endpoint',
    query: `fetch spans
| filter service.name == "backend" or service.name == "mail-service"
| summarize avg(duration), p95(duration), count(), by: { service.name, span.name }`,
    description: 'Calculate average and P95 execution duration for each service endpoint.',
  },
  {
    name: 'Failed Signups & Validation Errors',
    query: `fetch logs
| filter status == "error" or level == "error"
| parse content, "JSON:log"
| fields timestamp, service, log.message, trace_id, span_id`,
    description: 'Isolate error logs with automatic trace and span correlation IDs.',
  },
  {
    name: 'OpenTelemetry Trace Ingestion Rate',
    query: `timeseries sum(otelcol_receiver_accepted_spans), by: { transport }
| interval: 1m`,
    description: 'View the throughput of traces ingested by the OpenTelemetry Collector.',
  },
  {
    name: 'Redis Cache Hit / Miss Analysis',
    query: `fetch spans
| filter service.name == "template-service"
| filter span.name in ["get", "setex"]
| summarize count(), by: { span.name, status.code }`,
    description: 'Analyze cache lookups and writes in Redis DB 2 for template rendering.',
  },
];
