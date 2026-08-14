import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mapProviderStatus,
  getSubscriptionAccess,
  getGracePeriodDays,
  planPriceForInterval,
  providerPlanRef,
  type AccessSubscriptionLike,
} from "../src/lib/billing";

// ------------------------------------------------------------------
// mapProviderStatus
// ------------------------------------------------------------------

test("mapProviderStatus: maps stripe statuses", () => {
  assert.equal(mapProviderStatus("stripe", "trialing"), "TRIAL");
  assert.equal(mapProviderStatus("stripe", "active"), "ACTIVE");
  assert.equal(mapProviderStatus("stripe", "past_due"), "PAST_DUE");
  assert.equal(mapProviderStatus("stripe", "incomplete"), "INCOMPLETE");
  assert.equal(mapProviderStatus("stripe", "incomplete_expired"), "EXPIRED");
  assert.equal(mapProviderStatus("stripe", "canceled"), "CANCELLED");
  assert.equal(mapProviderStatus("stripe", "unpaid"), "PAST_DUE");
});

test("mapProviderStatus: maps paystack statuses", () => {
  assert.equal(mapProviderStatus("paystack", "trialing"), "TRIAL");
  assert.equal(mapProviderStatus("paystack", "active"), "ACTIVE");
  assert.equal(mapProviderStatus("paystack", "cancelled"), "CANCELLED");
  assert.equal(mapProviderStatus("paystack", "non_renewing"), "CANCELLED");
  assert.equal(mapProviderStatus("paystack", "completed"), "EXPIRED");
});

test("mapProviderStatus: case-insensitive", () => {
  assert.equal(mapProviderStatus("stripe", "Active"), "ACTIVE");
});

test("mapProviderStatus: unknown statuses and providers map to null", () => {
  assert.equal(mapProviderStatus("stripe", "totally_unknown"), null);
  assert.equal(mapProviderStatus("some_other_provider", "active"), null);
});

// ------------------------------------------------------------------
// getSubscriptionAccess
// ------------------------------------------------------------------

const now = new Date("2026-08-14T12:00:00.000Z");

function daysFromNow(days: number): Date {
  return new Date(now.getTime() + days * 86400000);
}

function sub(overrides: Partial<AccessSubscriptionLike>): AccessSubscriptionLike {
  return { status: "ACTIVE", ...overrides };
}

test("access: ACTIVE and TRIAL are full", () => {
  assert.equal(getSubscriptionAccess(sub({ status: "ACTIVE" }), now).access, "full");
  assert.equal(getSubscriptionAccess(sub({ status: "TRIAL" }), now).access, "full");
});

test("access: PAST_DUE within grace period grants grace, then restricts", () => {
  const missed = daysFromNow(-3);
  const grace = getSubscriptionAccess(sub({ status: "PAST_DUE", renewalDate: missed }), now, 7);
  assert.equal(grace.access, "grace");
  assert.equal(grace.restricted, false);
  assert.match(grace.message ?? "", /4 more days/);

  const past = getSubscriptionAccess(sub({ status: "PAST_DUE", renewalDate: daysFromNow(-8) }), now, 7);
  assert.equal(past.access, "restricted");
  assert.equal(past.restricted, true);
});

test("access: PAST_DUE without a missed date stays accessible", () => {
  const state = getSubscriptionAccess(sub({ status: "PAST_DUE" }), now, 7);
  assert.equal(state.access, "full");
});

test("access: CANCELLED keeps access until period end, then restricts", () => {
  const ending = getSubscriptionAccess(
    sub({ status: "CANCELLED", renewalDate: daysFromNow(5), cancelAtPeriodEnd: true }),
    now
  );
  assert.equal(ending.access, "ending");
  assert.equal(ending.restricted, false);

  const over = getSubscriptionAccess(
    sub({ status: "CANCELLED", renewalDate: daysFromNow(-1), cancelAtPeriodEnd: true }),
    now
  );
  assert.equal(over.access, "restricted");
  assert.equal(over.restricted, true);
});

test("access: EXPIRED and INCOMPLETE are restricted", () => {
  assert.equal(getSubscriptionAccess(sub({ status: "EXPIRED" }), now).restricted, true);
  assert.equal(getSubscriptionAccess(sub({ status: "INCOMPLETE" }), now).restricted, true);
});

test("access: grace period is configurable via env", () => {
  const missed = daysFromNow(-1);
  const withDefault = getSubscriptionAccess(sub({ status: "PAST_DUE", renewalDate: missed }), now);
  assert.equal(withDefault.access, "grace");

  const zero = getSubscriptionAccess(sub({ status: "PAST_DUE", renewalDate: missed }), now, 0);
  assert.equal(zero.access, "restricted");
});

// ------------------------------------------------------------------
// getGracePeriodDays
// ------------------------------------------------------------------

test("getGracePeriodDays: defaults to 7, honours env, clamps negatives", () => {
  assert.equal(getGracePeriodDays({}), 7);
  assert.equal(getGracePeriodDays({ BILLING_GRACE_PERIOD_DAYS: "14" }), 14);
  assert.equal(getGracePeriodDays({ BILLING_GRACE_PERIOD_DAYS: "garbage" }), 7);
  assert.equal(getGracePeriodDays({ BILLING_GRACE_PERIOD_DAYS: "-2" }), 7);
});

// ------------------------------------------------------------------
// Server-side price helpers
// ------------------------------------------------------------------

const PLAN = {
  priceMonthly: 65000,
  priceYearly: 650000,
  providerRef: "price_monthly_123",
  providerYearlyRef: "price_yearly_456",
};

test("planPriceForInterval: reads the correct interval", () => {
  assert.equal(planPriceForInterval(PLAN, "monthly"), 65000);
  assert.equal(planPriceForInterval(PLAN, "yearly"), 650000);
});

test("planPriceForInterval: accepts Prisma Decimal-like values", () => {
  const decimal = { toNumber: () => 25000.5 };
  assert.equal(planPriceForInterval({ priceMonthly: decimal, priceYearly: decimal } as never, "monthly"), 25000.5);
});

test("providerPlanRef: resolves per-interval refs, null when missing", () => {
  assert.equal(providerPlanRef(PLAN, "monthly"), "price_monthly_123");
  assert.equal(providerPlanRef(PLAN, "yearly"), "price_yearly_456");
  assert.equal(providerPlanRef({ providerRef: null, providerYearlyRef: null }, "monthly"), null);
  assert.equal(providerPlanRef({ providerRef: "x", providerYearlyRef: null }, "yearly"), null);
});
