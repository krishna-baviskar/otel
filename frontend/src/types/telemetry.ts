export type DataMode = 'LIVE' | 'LOCAL' | 'DEMO';

export type ServiceHealth = 'healthy' | 'degraded' | 'critical' | 'unknown' | 'unhealthy';

export interface ServiceNode {
  id: string;
  name: string;
  type: 'service' | 'database' | 'cache' | 'external' | 'collector' | 'backend' | string;
  technology?: string;
  status: ServiceHealth;
  requestRate?: number; // req/sec
  rpm?: number;
  errorRate?: number; // percentage
  avgLatency?: number; // ms
  latency?: number; // ms
  p95Latency?: number; // ms
  activeConnections?: number;
  instances?: number;
  description?: string;
  monitoredBy?: 'OneAgent' | 'OpenTelemetry' | 'Native';
  url?: string;
  port?: number;
  position?: { x: number; y: number };
}

export interface DependencyLink {
  id: string;
  source: string;
  target: string;
  protocol: 'HTTP' | 'gRPC' | 'TCP' | 'OTLP' | string;
  callRate?: number;
  avgLatency?: number;
  errorRate?: number;
  status?: 'healthy' | 'degraded' | 'critical' | string;
  callCount?: number;
}

export type ServiceLink = DependencyLink;

export interface SpanAttribute {
  key: string;
  value: string | number | boolean;
}

export interface SpanEvent {
  name: string;
  timestamp: number; // unix nano or ms
  attributes?: Record<string, any>;
}

export interface Span {
  id: string;
  traceId?: string;
  parentId?: string;
  name: string;
  serviceName: string;
  kind?: 'CLIENT' | 'SERVER' | 'INTERNAL' | 'PRODUCER' | 'CONSUMER';
  startTime: number;
  endTime: number;
  duration: number;
  depth: number;
  status: {
    code: 'OK' | 'ERROR' | 'UNSET' | string;
    message?: string;
  };
  attributes: Record<string, any>;
  events?: SpanEvent[];
  children?: Span[];
}

export interface TraceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  serviceName: string;
  kind: 'CLIENT' | 'SERVER' | 'INTERNAL' | 'PRODUCER' | 'CONSUMER';
  startTimeMs: number;
  durationMs: number;
  statusCode: 'OK' | 'ERROR' | 'UNSET';
  statusMessage?: string;
  attributes: Record<string, any>;
  events: SpanEvent[];
  depth?: number;
  children?: TraceSpan[];
}

export interface TraceDetail {
  id: string;
  rootOperation: string;
  hasErrors: boolean;
  source?: string;
  duration: number;
  spanCount: number;
  services: string[];
  timestamp: string;
  spans: Span[];
}

export interface TraceSummary {
  id?: string;
  traceId?: string;
  rootOperation?: string;
  rootServiceName?: string;
  rootOperationName?: string;
  startTime?: string;
  timestamp?: string;
  timestampMs?: number;
  duration?: number;
  durationMs?: number;
  spanCount: number;
  errorCount?: number;
  services: string[];
  hasErrors?: boolean;
  statusCode?: 'OK' | 'ERROR';
}

export interface MetricSeries {
  timestamp: string;
  timeLabel: string;
  requestsPerSec: number;
  errorRate: number;
  latencyAvg: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  cpuPercent: number;
  memoryMb: number;
  redisOpsPerSec: number;
  mongoLatencyMs: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'info' | 'warn' | 'error' | 'debug' | string;
  service: string;
  message: string;
  traceId?: string;
  spanId?: string;
  attributes?: Record<string, any>;
  rawJson?: Record<string, unknown>;
}

export type LogRecord = LogEntry;

export interface Incident {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INFO' | string;
  status: 'active' | 'resolved' | 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | string;
  startedAt?: string;
  rootCause?: string;
  impactedServices?: string[];
  affectedService?: string;
  detectedMetric?: string;
  threshold?: string;
  currentValue?: string;
  startTime?: string;
  duration?: string;
  relatedTraceId?: string;
  probableRootCause?: string;
  rootCauseTree?: RootCauseNode;
  isSimulated?: boolean;
}

export interface RootCauseNode {
  title: string;
  service: string;
  type: 'problem' | 'symptom' | 'root_cause';
  details: string;
  metric?: string;
  children?: RootCauseNode[];
}

export interface DqlQueryResult {
  query: string;
  executionTimeMs: number;
  source: 'LIVE DYNATRACE' | 'DEMO DATA';
  columns: string[];
  records: Record<string, unknown>[];
  totalRecords: number;
}

export interface SystemStatus {
  mode: DataMode;
  overallStatus?: ServiceHealth | string;
  environment: 'Local Docker' | 'Kubernetes' | 'Dynatrace Managed' | string;
  openTelemetry: {
    status: 'Healthy' | 'Degraded' | 'Offline' | string;
    collectorEndpoint: string;
    metricsEndpoint: string;
    acceptedSpans: number;
    sentSpans: number;
    uptimeSeconds: number;
    cpuSeconds: number;
    memoryBytes: number;
  };
  dynatrace: {
    connected: boolean;
    tenantUrl?: string;
    statusText: string;
    mode: 'Active' | 'Demo Mode' | string;
  };
  metrics?: {
    avgLatency: number;
    p95Latency: number;
    errorRate: number;
  };
  services: Record<string, ServiceNode>;
  activeIncidentsCount: number;
  lastUpdated: string;
}
