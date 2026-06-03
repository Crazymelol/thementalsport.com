// Mike's Stripe / finance integration. Server-side only.
//
// Uses Stripe's REST API directly via fetch (no SDK dependency) with the secret
// key as a Bearer token. Mirrors the real-or-stub pattern of gmail.ts/google.ts:
// if STRIPE_SECRET_KEY is absent, stripeConfigured() is false and the tools fall
// back to stub data so the app keeps working without an account connected.

const API = "https://api.stripe.com/v1";

function key(): string | undefined {
  return process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
}

export function stripeConfigured(): boolean {
  return Boolean(key());
}

/** Cents (Stripe's unit) → dollars, rounded to cents. Pure. */
export function centsToUSD(cents: number): number {
  return Math.round(cents) / 100;
}

export type Period = { gte: number; lte: number; label: string };

/**
 * Resolve a natural-language period into a unix-second range. Pure & testable.
 * Order matters: more specific phrases are matched before generic ones.
 */
export function parsePeriod(input: string, now = new Date()): Period {
  const lte = Math.floor(now.getTime() / 1000);
  const p = (input || "").trim().toLowerCase();
  const daysAgo = (n: number) => Math.floor((now.getTime() - n * 86_400_000) / 1000);
  const startOfToday = () => {
    const x = new Date(now);
    x.setHours(0, 0, 0, 0);
    return Math.floor(x.getTime() / 1000);
  };
  const firstOfMonth = () =>
    Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);

  if (p === "today") return { gte: startOfToday(), lte, label: "today" };
  if (p.includes("this month")) return { gte: firstOfMonth(), lte, label: "this month" };
  if (p.includes("this year"))
    return { gte: Math.floor(new Date(now.getFullYear(), 0, 1).getTime() / 1000), lte, label: "this year" };

  const m = p.match(/(\d+)\s*day/);
  if (m) {
    const n = parseInt(m[1], 10);
    return { gte: daysAgo(n), lte, label: `last ${n} days` };
  }
  if (p.includes("this week") || p.includes("week")) return { gte: daysAgo(7), lte, label: "last 7 days" };
  if (p.includes("month")) return { gte: daysAgo(30), lte, label: "last 30 days" };

  // Sensible default.
  return { gte: firstOfMonth(), lte, label: "this month" };
}

type Params = Record<string, string | number | undefined>;

async function stripeGet(path: string, params: Params = {}): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) qs.append(k, String(v));
  const res = await fetch(`${API}${path}?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${key()}` },
  });
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as Record<string, unknown>;
}

async function stripePost(path: string, form: Params): Promise<Record<string, unknown>> {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(form)) if (v !== undefined) body.append(k, String(v));
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as Record<string, unknown>;
}

type Charge = {
  id: string;
  amount: number;
  amount_refunded?: number;
  paid?: boolean;
  status?: string;
  description?: string;
  customer?: string;
  created: number;
  billing_details?: { email?: string | null };
};

export type RevenueSummary = {
  period: string;
  grossUSD: number;
  payments: number;
  activeSubscribers: number;
  failedPayments: number;
  currency: string;
};

/** Sum succeeded charges (net of refunds) over a period, with sub + failure counts. */
export async function getRevenueSummary(period: string): Promise<RevenueSummary> {
  const range = parsePeriod(period);
  let gross = 0;
  let payments = 0;
  let failed = 0;
  let startingAfter: string | undefined;

  // Page charges in the range, capped to avoid runaway pagination.
  for (let page = 0; page < 10; page++) {
    const data = await stripeGet("/charges", {
      "created[gte]": range.gte,
      "created[lte]": range.lte,
      limit: 100,
      starting_after: startingAfter,
    });
    const charges = (data.data as Charge[]) ?? [];
    for (const c of charges) {
      if (c.paid && c.status === "succeeded") {
        gross += c.amount - (c.amount_refunded ?? 0);
        payments++;
      }
      if (c.status === "failed") failed++;
    }
    if (!data.has_more || charges.length === 0) break;
    startingAfter = charges[charges.length - 1].id;
  }

  // Count active subscribers (capped pagination).
  let activeSubscribers = 0;
  let subAfter: string | undefined;
  for (let page = 0; page < 10; page++) {
    const data = await stripeGet("/subscriptions", { status: "active", limit: 100, starting_after: subAfter });
    const subs = (data.data as { id: string }[]) ?? [];
    activeSubscribers += subs.length;
    if (!data.has_more || subs.length === 0) break;
    subAfter = subs[subs.length - 1].id;
  }

  return {
    period: range.label,
    grossUSD: centsToUSD(gross),
    payments,
    activeSubscribers,
    failedPayments: failed,
    currency: "usd",
  };
}

export type PaymentRow = {
  id: string;
  amountUSD: number;
  refundedUSD: number;
  status: string;
  customer: string;
  created: string;
  description: string;
};

/** Recent charges, newest first — gives Mike charge ids to refund against. */
export async function listRecentPayments(limit = 10): Promise<PaymentRow[]> {
  const data = await stripeGet("/charges", { limit: Math.min(Math.max(limit, 1), 100) });
  const charges = (data.data as Charge[]) ?? [];
  return charges.map((c) => ({
    id: c.id,
    amountUSD: centsToUSD(c.amount),
    refundedUSD: centsToUSD(c.amount_refunded ?? 0),
    status: c.status ?? "unknown",
    customer: c.billing_details?.email ?? c.customer ?? "unknown",
    created: new Date(c.created * 1000).toISOString().slice(0, 10),
    description: c.description ?? "",
  }));
}

export type RefundResult = {
  refunded: boolean;
  id: string;
  chargeId: string;
  amountUSD: number;
  status: string;
};

const REFUND_REASONS = new Set(["duplicate", "fraudulent", "requested_by_customer"]);

/** Issue a refund against a charge id (optionally partial). */
export async function issueRefund(args: {
  chargeId: string;
  amountUSD?: number;
  reason?: string;
}): Promise<RefundResult> {
  const form: Params = { charge: args.chargeId };
  if (typeof args.amountUSD === "number" && args.amountUSD > 0) {
    form.amount = Math.round(args.amountUSD * 100);
  }
  if (args.reason && REFUND_REASONS.has(args.reason)) form.reason = args.reason;

  const r = await stripePost("/refunds", form);
  const status = String(r.status ?? "");
  return {
    refunded: status === "succeeded" || status === "pending",
    id: String(r.id ?? ""),
    chargeId: args.chargeId,
    amountUSD: centsToUSD(typeof r.amount === "number" ? r.amount : 0),
    status,
  };
}
