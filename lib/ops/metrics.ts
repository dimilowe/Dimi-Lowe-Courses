const ONE_MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_EVENT_BUFFER = 20000;

type CountMap = Record<string, number>;

interface OpsState {
  startedAt: number;
  apiEvents: number[];
  dbEvents: number[];
  dbDurationTotalMs: number;
  organicEvents: number[];
  apiByRoute: CountMap;
  cacheByKey: Record<string, { requests: number; misses: number }>;
}

declare global {
  // eslint-disable-next-line no-var
  var __vcmOpsMetricsState: OpsState | undefined;
}

function createInitialState(): OpsState {
  return {
    startedAt: Date.now(),
    apiEvents: [],
    dbEvents: [],
    dbDurationTotalMs: 0,
    organicEvents: [],
    apiByRoute: {},
    cacheByKey: {},
  };
}

const state: OpsState = globalThis.__vcmOpsMetricsState ?? createInitialState();
globalThis.__vcmOpsMetricsState = state;

function pruneEvents(events: number[], now: number, maxAgeMs: number): void {
  while (events.length > 0 && now - events[0] > maxAgeMs) {
    events.shift();
  }
  if (events.length > MAX_EVENT_BUFFER) {
    events.splice(0, events.length - MAX_EVENT_BUFFER);
  }
}

function countRecent(events: number[], now: number, windowMs: number): number {
  let count = 0;
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (now - events[i] > windowMs) break;
    count += 1;
  }
  return count;
}

function normalizeRouteKey(route: string): string {
  return route
    .replace(/\/\d+(?=\/|$)/g, "/:id")
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
      "/:id"
    );
}

export function recordApiInvocation(route: string): void {
  const now = Date.now();
  const normalizedRoute = normalizeRouteKey(route);
  state.apiEvents.push(now);
  state.apiByRoute[normalizedRoute] = (state.apiByRoute[normalizedRoute] || 0) + 1;
  pruneEvents(state.apiEvents, now, ONE_DAY_MS);
}

export function recordDbQuery(durationMs: number): void {
  const now = Date.now();
  state.dbEvents.push(now);
  state.dbDurationTotalMs += Math.max(0, durationMs);
  pruneEvents(state.dbEvents, now, ONE_DAY_MS);
}

export function recordOrganicVisit(): void {
  const now = Date.now();
  state.organicEvents.push(now);
  pruneEvents(state.organicEvents, now, ONE_DAY_MS);
}

export function recordCacheRequest(key: string): void {
  const current = state.cacheByKey[key] ?? { requests: 0, misses: 0 };
  current.requests += 1;
  state.cacheByKey[key] = current;
}

export function recordCacheMiss(key: string): void {
  const current = state.cacheByKey[key] ?? { requests: 0, misses: 0 };
  current.misses += 1;
  state.cacheByKey[key] = current;
}

function parseCost(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getOpsMetricsSnapshot() {
  const now = Date.now();
  pruneEvents(state.apiEvents, now, ONE_DAY_MS);
  pruneEvents(state.dbEvents, now, ONE_DAY_MS);
  pruneEvents(state.organicEvents, now, ONE_DAY_MS);

  const apiLastMinute = countRecent(state.apiEvents, now, ONE_MINUTE_MS);
  const dbLastMinute = countRecent(state.dbEvents, now, ONE_MINUTE_MS);

  const apiLast24h = state.apiEvents.length;
  const dbLast24h = state.dbEvents.length;
  const organicLast24h = state.organicEvents.length;

  const apiUnitCost = parseCost(process.env.OPS_COST_PER_API_INVOCATION_USD, 0);
  const dbUnitCost = parseCost(process.env.OPS_COST_PER_DB_QUERY_USD, 0);

  const estimatedCostLast24hUsd = apiLast24h * apiUnitCost + dbLast24h * dbUnitCost;
  const costPer1kOrganicVisitsUsd =
    organicLast24h > 0 ? estimatedCostLast24hUsd / (organicLast24h / 1000) : null;

  const cache = Object.entries(state.cacheByKey)
    .sort((a, b) => b[1].requests - a[1].requests)
    .map(([key, value]) => {
      const hits = Math.max(0, value.requests - value.misses);
      return {
        key,
        requests: value.requests,
        misses: value.misses,
        hits,
        hitRate: value.requests > 0 ? hits / value.requests : 0,
      };
    });

  const cacheTotals = cache.reduce(
    (acc, item) => {
      acc.requests += item.requests;
      acc.misses += item.misses;
      return acc;
    },
    { requests: 0, misses: 0 }
  );
  const cacheHits = Math.max(0, cacheTotals.requests - cacheTotals.misses);

  const topApiRoutes = Object.entries(state.apiByRoute)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));

  return {
    generatedAt: new Date(now).toISOString(),
    uptimeSeconds: Math.floor((now - state.startedAt) / 1000),
    api: {
      invocationsLastMinute: apiLastMinute,
      invocationsLast24h: apiLast24h,
      invocationRatePerSecond: apiLastMinute / 60,
      topRoutes: topApiRoutes,
    },
    db: {
      queriesLastMinute: dbLastMinute,
      queriesLast24h: dbLast24h,
      qpsLastMinute: dbLastMinute / 60,
      avgQueryDurationMs:
        state.dbEvents.length > 0 ? state.dbDurationTotalMs / state.dbEvents.length : 0,
    },
    cache: {
      requests: cacheTotals.requests,
      misses: cacheTotals.misses,
      hits: cacheHits,
      hitRate: cacheTotals.requests > 0 ? cacheHits / cacheTotals.requests : 0,
      byKey: cache,
    },
    organic: {
      visitsLast24h: organicLast24h,
    },
    cost: {
      assumedApiInvocationCostUsd: apiUnitCost,
      assumedDbQueryCostUsd: dbUnitCost,
      estimatedCostLast24hUsd,
      costPer1kOrganicVisitsUsd,
    },
    note:
      "In-memory per-instance metrics for near-real-time ops visibility. Use external persistence for long-term/cluster-wide reporting.",
  };
}
