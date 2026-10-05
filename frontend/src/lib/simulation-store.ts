import { Incident } from '../types/telemetry';

export interface SimulationState {
  active: boolean;
  scenario: 'redis_slowdown' | 'service_error' | 'high_latency' | 'external_failure';
  affectedService: string;
  latencyMultiplier: number;
  errorRate: number;
  startedAt: string | null;
  incident: Incident | null;
}

// Global in-memory simulation state
let simulationState: SimulationState = {
  active: false,
  scenario: 'redis_slowdown',
  affectedService: 'redis',
  latencyMultiplier: 1.0,
  errorRate: 0.0,
  startedAt: null,
  incident: null,
};

export function getSimulationState(): SimulationState {
  return simulationState;
}

export function startSimulation(scenario: SimulationState['scenario'] = 'redis_slowdown'): SimulationState {
  const startedAt = new Date().toISOString();
  
  let affectedService = 'redis';
  let title = 'Severe Redis response degradation impacting mail workflows';
  let probableRootCause = 'Redis thread block during template cache write or high lock contention on DB 2.';
  let detectedMetric = 'redis.latency.p95';
  let threshold = '> 50ms';
  let currentValue = '485ms';
  let latencyMultiplier = 6.5;
  let errorRate = 18.5;

  if (scenario === 'service_error') {
    affectedService = 'backend';
    title = 'Signup validation failure storm (400 / 500 error spike)';
    probableRootCause = 'Malicious or malformed payload pattern triggering uncaught regex validation errors.';
    detectedMetric = 'http.server.error_rate';
    threshold = '> 2.0%';
    currentValue = '24.2%';
    latencyMultiplier = 1.2;
    errorRate = 24.2;
  } else if (scenario === 'external_failure') {
    affectedService = 'external-mail';
    title = 'External mail delivery provider gateway timeout';
    probableRootCause = 'SaaS mail delivery provider (httpbin.org) socket connection drops or rate-limit saturation.';
    detectedMetric = 'http.client.timeout_rate';
    threshold = '> 1.0%';
    currentValue = '38.0%';
    latencyMultiplier = 4.0;
    errorRate = 38.0;
  } else if (scenario === 'high_latency') {
    affectedService = 'template-service';
    title = 'Template rendering gRPC execution bottleneck';
    probableRootCause = 'Expensive mustache template parsing and repetitive synchronous AST computation.';
    detectedMetric = 'grpc.server.duration.p95';
    threshold = '> 100ms';
    currentValue = '920ms';
    latencyMultiplier = 8.0;
    errorRate = 6.5;
  }

  const incident: Incident = {
    id: `inc-${Date.now().toString(36)}`,
    title,
    severity: 'CRITICAL',
    status: 'OPEN',
    affectedService,
    detectedMetric,
    threshold,
    currentValue,
    startTime: startedAt,
    duration: 'Just now',
    relatedTraceId: '297a81485219144231b82695cd266b5d',
    probableRootCause,
    isSimulated: true,
    rootCauseTree: {
      title: `Problem: ${title}`,
      service: affectedService,
      type: 'problem',
      details: `Detected threshold violation: ${detectedMetric} reached ${currentValue} (Threshold: ${threshold})`,
      children: [
        {
          title: `Cascading Impact: Mail Service queuing delayed`,
          service: 'mail-service',
          type: 'symptom',
          details: 'Wait time on gRPC response increased by 420% as template calls backed up.',
          children: [
            {
              title: `Root Cause: ${probableRootCause}`,
              service: affectedService,
              type: 'root_cause',
              details: `Identified single point of failure in ${affectedService}. All subsequent transactions delayed.`,
            },
          ],
        },
      ],
    },
  };

  simulationState = {
    active: true,
    scenario,
    affectedService,
    latencyMultiplier,
    errorRate,
    startedAt,
    incident,
  };

  return simulationState;
}

export function stopSimulation(): SimulationState {
  simulationState = {
    active: false,
    scenario: 'redis_slowdown',
    affectedService: 'redis',
    latencyMultiplier: 1.0,
    errorRate: 0.0,
    startedAt: null,
    incident: null,
  };
  return simulationState;
}
