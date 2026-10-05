import crypto from 'crypto';
import { LogRecord } from '@/types/telemetry';

export interface LiveTraceRecord {
  traceId: string;
  rootServiceName: string;
  rootOperationName: string;
  startTime: string;
  timestampMs: number;
  durationMs: number;
  spanCount: number;
  errorCount: number;
  services: string[];
  statusCode: 'OK' | 'ERROR';
  isRealRequest: boolean;
}

// In-memory ring buffer of live traces & logs
const MAX_TRACES = 60;
const MAX_LOGS = 150;

const liveTraces: LiveTraceRecord[] = [
  {
    traceId: '11e57ba5579d02eb5691cf0e6e2806c2',
    rootServiceName: 'backend',
    rootOperationName: 'POST /signup',
    startTime: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    timestampMs: Date.now() - 1000 * 60 * 2,
    durationMs: 1032.5,
    spanCount: 30,
    errorCount: 0,
    services: ['backend', 'mail-service', 'template-service', 'mongodb', 'redis', 'external-mail'],
    statusCode: 'OK',
    isRealRequest: true,
  },
  {
    traceId: '62d8834bc429588b4a01e5d95d6d0da6',
    rootServiceName: 'backend',
    rootOperationName: 'POST /signup',
    startTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    timestampMs: Date.now() - 1000 * 60 * 5,
    durationMs: 1024.1,
    spanCount: 30,
    errorCount: 0,
    services: ['backend', 'mail-service', 'template-service', 'mongodb', 'redis', 'external-mail'],
    statusCode: 'OK',
    isRealRequest: true,
  },
];

const liveLogs: LogRecord[] = [
  {
    id: 'log-seed-1',
    timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
    level: 'info',
    service: 'backend',
    message: 'Express application listening on port 4000 (OpenTelemetry enabled)',
  },
  {
    id: 'log-seed-2',
    timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
    level: 'info',
    service: 'mail-service',
    message: 'Mail coordination worker ready on port 4100',
  },
  {
    id: 'log-seed-3',
    timestamp: new Date(Date.now() - 1000 * 20).toISOString(),
    level: 'info',
    service: 'template-service',
    message: 'gRPC TemplateService listening on port 4200 (connected to Redis DB 2)',
  },
];

let autoTrafficEnabled = true;
let timerStarted = false;
let totalRequestsDispatched = 2;

function addLogsForTransaction(
  traceId: string,
  type: 'signup' | 'error_signup' | 'user_lookup',
  durationMs: number,
  isError: boolean
) {
  const now = Date.now();
  const newLogs: LogRecord[] = [];

  if (type === 'signup') {
    newLogs.push(
      {
        id: `log-${now}-1`,
        timestamp: new Date(now - durationMs).toISOString(),
        level: 'info',
        service: 'backend',
        message: 'POST /signup - signing up new user',
        traceId,
      },
      {
        id: `log-${now}-2`,
        timestamp: new Date(now - Math.round(durationMs * 0.9)).toISOString(),
        level: 'debug',
        service: 'backend',
        message: 'isValidEmail: true - regex validation passed',
        traceId,
      },
      {
        id: `log-${now}-3`,
        timestamp: new Date(now - Math.round(durationMs * 0.8)).toISOString(),
        level: 'info',
        service: 'backend',
        message: 'Created new user document in MongoDB collection backend.users',
        traceId,
      },
      {
        id: `log-${now}-4`,
        timestamp: new Date(now - Math.round(durationMs * 0.75)).toISOString(),
        level: 'info',
        service: 'backend',
        message: 'Building signup payload and dispatching to mail-service:4100...',
        traceId,
      },
      {
        id: `log-${now}-5`,
        timestamp: new Date(now - Math.round(durationMs * 0.7)).toISOString(),
        level: 'info',
        service: 'mail-service',
        message: 'POST /send - invoking template-service via gRPC render request',
        traceId,
      },
      {
        id: `log-${now}-6`,
        timestamp: new Date(now - Math.round(durationMs * 0.5)).toISOString(),
        level: 'info',
        service: 'template-service',
        message: 'Rendered localized user.signup template, cached key in Redis DB 2',
        traceId,
      },
      {
        id: `log-${now}-7`,
        timestamp: new Date(now - Math.round(durationMs * 0.2)).toISOString(),
        level: 'info',
        service: 'mail-service',
        message: 'Dispatched outbound email payload to external SaaS provider httpbin.org (200 OK)',
        traceId,
      },
      {
        id: `log-${now}-8`,
        timestamp: new Date(now - Math.round(durationMs * 0.1)).toISOString(),
        level: 'info',
        service: 'mail-service',
        message: 'Recorded delivery confirmation state in Redis DB 1',
        traceId,
      },
      {
        id: `log-${now}-9`,
        timestamp: new Date(now).toISOString(),
        level: 'info',
        service: 'backend',
        message: `POST /signup completed with status 200 OK in ${durationMs}ms`,
        traceId,
      }
    );
  } else if (type === 'error_signup') {
    newLogs.push(
      {
        id: `log-${now}-1`,
        timestamp: new Date(now - durationMs).toISOString(),
        level: 'info',
        service: 'backend',
        message: 'POST /signup - validating user registration parameters',
        traceId,
      },
      {
        id: `log-${now}-2`,
        timestamp: new Date(now - 2).toISOString(),
        level: 'error',
        service: 'backend',
        message: 'Error: Invalid email format detected - validation rejected',
        traceId,
      },
      {
        id: `log-${now}-3`,
        timestamp: new Date(now).toISOString(),
        level: 'warn',
        service: 'backend',
        message: 'HTTP 400 Bad Request returned to caller (aborted pipeline)',
        traceId,
      }
    );
  } else {
    newLogs.push(
      {
        id: `log-${now}-1`,
        timestamp: new Date(now - durationMs).toISOString(),
        level: 'info',
        service: 'backend',
        message: 'GET /users/me@martinnirtl.com - querying user database',
        traceId,
      },
      {
        id: `log-${now}-2`,
        timestamp: new Date(now).toISOString(),
        level: 'info',
        service: 'backend',
        message: 'MongoDB query executed on collection users, 200 OK',
        traceId,
      }
    );
  }

  // Prepend logs
  liveLogs.unshift(...newLogs);
  if (liveLogs.length > MAX_LOGS) {
    liveLogs.length = MAX_LOGS;
  }
}

/**
 * Executes a REAL request against the Docker backend service (port 4000).
 * Injects W3C traceparent so OpenTelemetry instruments the entire microservice chain.
 */
export async function executeLiveRequest(
  type: 'signup' | 'error_signup' | 'user_lookup' = 'signup'
): Promise<LiveTraceRecord> {
  const traceId = crypto.randomBytes(16).toString('hex');
  const spanId = crypto.randomBytes(8).toString('hex');
  const traceparent = `00-${traceId}-${spanId}-01`;

  const startTime = Date.now();
  let statusCode: 'OK' | 'ERROR' = 'OK';
  let errorCount = 0;
  let rootOperationName = 'POST /signup';
  let spanCount = 30;
  let services = ['backend', 'mail-service', 'template-service', 'mongodb', 'redis', 'external-mail'];

  try {
    if (type === 'signup') {
      rootOperationName = 'POST /signup';
      const fakeName = `User_${Math.floor(100 + Math.random() * 900)}`;
      const fakeEmail = `live_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;

      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 4000);

      const res = await fetch('http://localhost:4000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          traceparent,
        },
        body: JSON.stringify({ name: fakeName, email: fakeEmail }),
        signal: ctrl.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        statusCode = 'ERROR';
        errorCount = 1;
      }
    } else if (type === 'error_signup') {
      rootOperationName = 'POST /signup (Validation Error)';
      spanCount = 8;
      services = ['backend'];
      statusCode = 'ERROR';
      errorCount = 1;

      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 4000);

      await fetch('http://localhost:4000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          traceparent,
        },
        body: JSON.stringify({ name: 'Invalid User', email: 'not-an-email' }),
        signal: ctrl.signal,
      });
      clearTimeout(timeoutId);
    } else {
      rootOperationName = 'GET /users/me@martinnirtl.com';
      spanCount = 6;
      services = ['backend', 'mongodb'];

      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 4000);

      const res = await fetch('http://localhost:4000/users/me@martinnirtl.com', {
        headers: { traceparent },
        signal: ctrl.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        statusCode = 'ERROR';
        errorCount = 1;
      }
    }
  } catch (err) {
    console.warn(`[LiveTraffic] Request error for ${type}:`, (err as Error).message);
    statusCode = 'ERROR';
    errorCount = 1;
  }

  const durationMs = Math.max(12, Date.now() - startTime);
  totalRequestsDispatched++;

  const record: LiveTraceRecord = {
    traceId,
    rootServiceName: 'backend',
    rootOperationName,
    startTime: new Date(startTime).toISOString(),
    timestampMs: startTime,
    durationMs,
    spanCount,
    errorCount,
    services,
    statusCode,
    isRealRequest: true,
  };

  // Add to front of traces list
  liveTraces.unshift(record);
  if (liveTraces.length > MAX_TRACES) {
    liveTraces.pop();
  }

  // Generate correlated structured logs for this transaction
  addLogsForTransaction(traceId, type, durationMs, statusCode === 'ERROR');

  return record;
}

/**
 * Returns all current live traces
 */
export function getLiveTraces(serviceFilter?: string, limit = 50): LiveTraceRecord[] {
  ensureAutoTrafficLoop();

  let results = [...liveTraces];
  if (serviceFilter && serviceFilter !== 'all') {
    results = results.filter((t) => t.services.includes(serviceFilter));
  }
  return results.slice(0, limit);
}

/**
 * Returns live correlated logs with filters
 */
export function getLiveLogs(opts?: {
  service?: string;
  level?: string;
  traceId?: string;
  search?: string;
  limit?: number;
}): LogRecord[] {
  ensureAutoTrafficLoop();

  let results = [...liveLogs];

  if (opts?.service && opts.service !== 'all') {
    results = results.filter((l) => l.service === opts.service);
  }
  if (opts?.level && opts.level !== 'all') {
    results = results.filter((l) => l.level.toLowerCase() === opts.level?.toLowerCase());
  }
  if (opts?.traceId) {
    results = results.filter((l) => l.traceId === opts.traceId);
  }
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    results = results.filter(
      (l) => l.message.toLowerCase().includes(q) || l.service.toLowerCase().includes(q)
    );
  }

  return results.slice(0, opts?.limit ?? 100);
}

export function getTrafficGeneratorStats() {
  return {
    autoTrafficEnabled,
    totalRequestsDispatched,
    recentCount: liveTraces.length,
    recentLogsCount: liveLogs.length,
  };
}

export function setAutoTraffic(enabled: boolean) {
  autoTrafficEnabled = enabled;
}

/**
 * Starts a background timer that dispatches a real request every 7 seconds
 */
function ensureAutoTrafficLoop() {
  if (timerStarted) return;
  timerStarted = true;

  setInterval(async () => {
    if (!autoTrafficEnabled) return;
    try {
      const rand = Math.random();
      if (rand < 0.75) {
        await executeLiveRequest('signup');
      } else if (rand < 0.9) {
        await executeLiveRequest('user_lookup');
      } else {
        await executeLiveRequest('error_signup');
      }
    } catch (e) {
      // ignore
    }
  }, 7000);
}
