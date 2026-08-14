/**
 * Billing abstraction — the seam between Mazikor Schools and a payment provider.
 *
 * The application never talks to a specific provider directly. It depends on the
 * `BillingProvider` interface below and resolves the configured implementation at
 * runtime via `getBillingProvider()` (selected by the `BILLING_PROVIDER` env var).
 *
 * HONESTY RULES (see docs/BILLING.md):
 *  - The provider's webhook is the ONLY source of truth for payment/subscription
 *    status. A frontend success redirect proves nothing.
 *  - Client-submitted price, plan price and subscription status are never trusted.
 *    Prices are read from the `Plan` row server-side; status is derived from
 *    provider confirmations.
 *  - Provider secret keys exist only server-side and are never exposed to the client.
 *
 * Until a real provider is wired up (via `BILLING_PROVIDER`), `getBillingProvider()`
 * returns a null provider and every payment operation fails loudly. Subscriptions are
 * then managed manually by platform administrators — nothing is faked.
 */

import type { SubStatus } from "@prisma/client";

export type BillingInterval = "monthly" | "yearly";

// ------------------------------------------------------------------
// Provider interface
// ------------------------------------------------------------------

export interface CreateCustomerParams {
  schoolId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  currency?: string;
}

export interface CustomerRef {
  /** Provider-side customer id. */
  id: string;
}

export interface CheckoutParams {
  schoolId: string;
  subscriptionId: string;
  planId: string;
  interval: BillingInterval;
  /** Absolute URL the customer is sent to after checkout. */
  returnUrl: string;
}

export interface CheckoutResult {
  /** URL the customer is redirected to (hosted checkout page). */
  url: string;
  /** Provider reference (e.g. checkout/session id) for correlation. */
  reference: string;
}

export interface CreateSubscriptionParams {
  customerId: string;
  /** Provider plan/price reference for the chosen plan+interval. */
  planRef: string;
  interval: BillingInterval;
  metadata?: Record<string, string>;
}

export interface ProviderSubscriptionRef {
  id: string;
  status: string;
}

export interface CancelParams {
  schoolId: string;
  subscriptionId: string;
  /** When true, access continues until the end of the current billing period. */
  atPeriodEnd: boolean;
}

export interface CancelResult {
  ok: boolean;
  /** Confirmed behaviour on the provider side. */
  atPeriodEnd: boolean;
}

export interface ChangePlanParams {
  subscriptionId: string;
  planRef: string;
  interval: BillingInterval;
}

export interface ChangePlanResult {
  ok: boolean;
}

/** Authoritative snapshot of a subscription as seen by the provider. */
export interface ProviderSubscriptionSnapshot {
  provider: string;
  providerSubscriptionId: string;
  providerCustomerId?: string | null;
  /** Provider plan/price reference currently on the subscription. */
  providerPlanRef: string;
  /** Raw provider status string (mapped via `mapProviderStatus`). */
  status: string;
  amount?: number;
  currency?: string;
  interval?: BillingInterval;
  currentPeriodEnd?: Date | null;
  trialEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}

export interface BillingProvider {
  readonly id: string;
  createCustomer(input: CreateCustomerParams): Promise<CustomerRef>;
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  createSubscription(params: CreateSubscriptionParams): Promise<ProviderSubscriptionRef>;
  cancelSubscription(params: CancelParams): Promise<CancelResult>;
  changePlan(params: ChangePlanParams): Promise<ChangePlanResult>;
  getSubscription(providerSubscriptionId: string): Promise<ProviderSubscriptionSnapshot>;
  handleWebhook(request: Request): Promise<Response>;
}

// ------------------------------------------------------------------
// Errors / null provider
// ------------------------------------------------------------------

export class BillingProviderNotConfiguredError extends Error {
  constructor() {
    super("No billing provider is configured. Set BILLING_PROVIDER to enable payments.");
    this.name = "BillingProviderNotConfiguredError";
  }
}

class NullProvider implements BillingProvider {
  readonly id = "none";

  private unsupported(): never {
    throw new BillingProviderNotConfiguredError();
  }

  createCustomer(): Promise<CustomerRef> {
    return this.unsupported();
  }

  createCheckout(): Promise<CheckoutResult> {
    return this.unsupported();
  }

  createSubscription(): Promise<ProviderSubscriptionRef> {
    return this.unsupported();
  }

  cancelSubscription(): Promise<CancelResult> {
    return this.unsupported();
  }

  changePlan(): Promise<ChangePlanResult> {
    return this.unsupported();
  }

  getSubscription(): Promise<ProviderSubscriptionSnapshot> {
    return this.unsupported();
  }

  async handleWebhook(): Promise<Response> {
    return new Response("Billing provider is not configured", { status: 501 });
  }
}

// ------------------------------------------------------------------
// Registry
// ------------------------------------------------------------------

const providers = new Map<string, () => BillingProvider>();
const nullProvider = new NullProvider();

export function registerBillingProvider(id: string, factory: () => BillingProvider): void {
  providers.set(id, factory);
}

export function getBillingProvider(): BillingProvider {
  const configured = process.env.BILLING_PROVIDER;
  const factory = configured ? providers.get(configured) : null;
  return factory ? factory() : nullProvider;
}

/** True when a real billing provider has been selected via `BILLING_PROVIDER`. */
export function isBillingConfigured(): boolean {
  const configured = process.env.BILLING_PROVIDER;
  return Boolean(configured && providers.has(configured));
}

/** Id of the configured provider, or null. */
export function getConfiguredBillingProviderId(): string | null {
  const configured = process.env.BILLING_PROVIDER;
  return configured && providers.has(configured) ? configured : null;
}

// ------------------------------------------------------------------
// Provider status → Mazikor status mapping
// ------------------------------------------------------------------
//
// These maps translate a provider's raw subscription status into Mazikor's
// internal `SubStatus`. They are reference mappings for common providers;
// provider implementations should re-use `mapProviderStatus` and can extend
// the table (see docs/BILLING.md).

const PROVIDER_STATUS_MAPS: Record<string, Record<string, SubStatus>> = {
  stripe: {
    trialing: "TRIAL",
    active: "ACTIVE",
    past_due: "PAST_DUE",
    incomplete: "INCOMPLETE",
    incomplete_expired: "EXPIRED",
    canceled: "CANCELLED",
    unpaid: "PAST_DUE",
    paused: "PAST_DUE",
  },
  paystack: {
    trialing: "TRIAL",
    active: "ACTIVE",
    paused: "PAST_DUE",
    cancelled: "CANCELLED",
    non_renewing: "CANCELLED",
    completed: "EXPIRED",
  },
};

/** Map a raw provider status to a Mazikor `SubStatus`, or `null` when unknown. */
export function mapProviderStatus(provider: string, status: string): SubStatus | null {
  const map = PROVIDER_STATUS_MAPS[provider];
  if (!map) return null;
  return map[status.toLowerCase()] ?? null;
}

// ------------------------------------------------------------------
// Subscription access control
// ------------------------------------------------------------------

export type SubscriptionAccess =
  | "full" // normal access (ACTIVE, TRIAL)
  | "grace" // PAST_DUE within the configured grace period
  | "ending" // CANCELLED with access until the end of the billing period
  | "restricted"; // EXPIRED / INCOMPLETE / past grace / past period end

export interface SubscriptionAccessState {
  access: SubscriptionAccess;
  restricted: boolean;
  message: string | null;
}

export interface AccessSubscriptionLike {
  status: string;
  cancelAtPeriodEnd?: boolean;
  renewalDate?: Date | string | null;
  trialEndsAt?: Date | string | null;
  endedAt?: Date | string | null;
}

/** Configurable grace period (days) for PAST_DUE subscriptions. Default 7. */
export function getGracePeriodDays(env: Record<string, string | undefined> = process.env): number {
  const n = Number.parseInt(env.BILLING_GRACE_PERIOD_DAYS ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : 7;
}

function toDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Decide how a subscription status affects access. Pure function — unit-tested.
 *
 * Policy:
 *  - ACTIVE / TRIAL  → full access.
 *  - PAST_DUE        → grace for `graceDays` after the missed renewal date, then restricted.
 *  - CANCELLED       → access until the end of the current billing period, then restricted.
 *  - EXPIRED         → restricted.
 *  - INCOMPLETE      → restricted (checkout not completed).
 */
export function getSubscriptionAccess(
  sub: AccessSubscriptionLike,
  now: Date = new Date(),
  graceDays: number = getGracePeriodDays()
): SubscriptionAccessState {
  const full = (): SubscriptionAccessState => ({ access: "full", restricted: false, message: null });

  switch (sub.status) {
    case "ACTIVE":
    case "TRIAL":
      return full();

    case "PAST_DUE": {
      const missed = toDate(sub.renewalDate) ?? toDate(sub.endedAt);
      if (!missed) return full();
      const graceEnd = addDays(missed, graceDays);
      if (now < graceEnd) {
        const remaining = Math.max(0, Math.ceil((graceEnd.getTime() - now.getTime()) / 86400000));
        return {
          access: "grace",
          restricted: false,
          message: `Your payment is past due. Your subscription remains active for ${remaining} more day${remaining === 1 ? "" : "s"}. Please update your payment method to avoid interruption.`,
        };
      }
      return {
        access: "restricted",
        restricted: true,
        message: "Your subscription has been suspended because a payment is past due. Renew to restore access.",
      };
    }

    case "CANCELLED": {
      const end = toDate(sub.renewalDate) ?? toDate(sub.endedAt);
      if (!end || now >= end) {
        return {
          access: "restricted",
          restricted: true,
          message: "Your subscription has ended. Renew to restore access.",
        };
      }
      return {
        access: "ending",
        restricted: false,
        message: `Your subscription is cancelled and ends on ${end.toLocaleDateString()}. You can renew at any time.`,
      };
    }

    case "EXPIRED":
      return {
        access: "restricted",
        restricted: true,
        message: "Your subscription has expired. Renew to restore access.",
      };

    case "INCOMPLETE":
      return {
        access: "restricted",
        restricted: true,
        message: "Your checkout was not completed. Complete payment to activate your subscription.",
      };

    default:
      return {
        access: "restricted",
        restricted: true,
        message: "This subscription is not active. Contact support.",
      };
  }
}

// ------------------------------------------------------------------
// Server-side price helpers (authoritative — never read from the client)
// ------------------------------------------------------------------

export function planPriceForInterval(
  plan: { priceMonthly: number | string | { toNumber(): number }; priceYearly: number | string | { toNumber(): number } },
  interval: BillingInterval
): number {
  const toN = (v: number | string | { toNumber(): number }): number =>
    typeof v === "object" && v !== null && "toNumber" in v ? v.toNumber() : Number(v ?? 0);
  const raw = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
  return Number.isFinite(toN(raw)) ? toN(raw) : 0;
}

export function providerPlanRef(
  plan: { providerRef?: string | null; providerYearlyRef?: string | null },
  interval: BillingInterval
): string | null {
  return (interval === "yearly" ? plan.providerYearlyRef : plan.providerRef) ?? null;
}
