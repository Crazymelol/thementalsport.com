// Per-provider health tracking for the model council.
// State is module-level so it persists across requests on warm Vercel instances.
// On cold start it resets — that's acceptable; the tracker self-heals within a session.

const CONSECUTIVE_FAIL_THRESHOLD = 3;
const COOLDOWN_MS = 60_000;

type Record = {
  consecutiveFails: number;
  lastFailAt: number;
  totalFails: number;
  totalSuccess: number;
};

const state = new Map<string, Record>();

function get(name: string): Record {
  if (!state.has(name)) {
    state.set(name, { consecutiveFails: 0, lastFailAt: 0, totalFails: 0, totalSuccess: 0 });
  }
  return state.get(name)!;
}

export function recordSuccess(name: string): void {
  const r = get(name);
  r.consecutiveFails = 0;
  r.totalSuccess += 1;
}

export function recordFailure(name: string): void {
  const r = get(name);
  r.consecutiveFails += 1;
  r.lastFailAt = Date.now();
  r.totalFails += 1;
}

export function isCoolingDown(name: string): boolean {
  const r = get(name);
  return (
    r.consecutiveFails >= CONSECUTIVE_FAIL_THRESHOLD &&
    Date.now() - r.lastFailAt < COOLDOWN_MS
  );
}

/** Returns providers sorted: healthy ones first, cooling-down ones last.
 *  Never drops a provider entirely — if everything is cooling down we still try them all. */
export function sortedByHealth<T extends { name: string }>(providers: T[]): T[] {
  const healthy = providers.filter((p) => !isCoolingDown(p.name));
  const cooling = providers.filter((p) => isCoolingDown(p.name));
  return [...healthy, ...cooling];
}

/** Summary for logging / debugging. */
export function healthReport(): string {
  return [...state.entries()]
    .map(([name, r]) => `${name}: ok=${r.totalSuccess} fail=${r.totalFails} consec=${r.consecutiveFails} cooling=${isCoolingDown(name)}`)
    .join(" | ");
}
