/**
 * Idempotent webhook processing + subscription reconciliation.
 *
 * A real billing provider implementation parses its signed webhook payload into a
 * `ProviderSubscriptionSnapshot` (see `src/lib/billing.ts`) and hands it to
 * `applyBillingEvent`. That single entry point:
 *
 *  1. Records the webhook under a unique `(provider, eventId)` key. A replayed or
 *     duplicated delivery hits the unique constraint and is treated as a no-op, so
 *     the same webhook can never create duplicate records or double-apply a change.
 *  2. Maps the provider status → Mazikor `SubStatus` (with the "cancelled but access
 *     continues to period end" rule).
 *  3. Resolves the Mazikor `Plan` from the provider plan/price reference.
 *  4. Reconciles the `Subscription` row from the authoritative provider snapshot.
 *  5. Appends a `BillingEvent` history entry.
 *
 * Everything runs inside one transaction, so a crash cannot leave the webhook marked
 * processed without the subscription being updated.
 */

import { db } from "@/lib/db";
import { mapProviderStatus, type ProviderSubscriptionSnapshot } from "@/lib/billing";
import { revalidatePath } from "next/cache";

export interface ApplyBillingEventInput {
  provider: string;
  /** Provider's unique event id — the idempotency key. */
  eventId: string;
  /** Provider event type, stored verbatim for the audit trail. */
  type: string;
  payload?: unknown;
  /** The school the event belongs to (from provider metadata/customer lookup). */
  schoolId: string;
  state: ProviderSubscriptionSnapshot;
}

export interface ApplyBillingEventResult {
  /** True when this exact event had already been processed. */
  deduplicated: boolean;
  /** True when the subscription row was updated. */
  updated: boolean;
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

function toInterval(i: ProviderSubscriptionSnapshot["interval"]): "MONTHLY" | "YEARLY" {
  return i === "yearly" ? "YEARLY" : "MONTHLY";
}

export async function applyBillingEvent(input: ApplyBillingEventInput): Promise<ApplyBillingEventResult> {
  const { provider, eventId, type, payload, schoolId, state } = input;

  try {
    return await db.$transaction(async (tx) => {
      await tx.billingWebhook.create({
        data: {
          provider,
          eventId,
          type,
          schoolId,
          status: state.status,
          payload: (payload ?? {}) as object,
        },
      });

      const subscription = await tx.subscription.findUnique({ where: { schoolId } });
      if (!subscription) {
        // No local subscription for this school — record the event but never fabricate one.
        await tx.billingEvent.create({
          data: { schoolId, provider, type, data: (payload ?? {}) as object },
        });
        return { deduplicated: false, updated: false };
      }

      // Resolve the plan from the provider plan/price reference (authoritative,
      // never from the client). Falls back to the current plan when unknown.
      const plan = await tx.plan.findFirst({
        where: {
          OR: [{ providerRef: state.providerPlanRef }, { providerYearlyRef: state.providerPlanRef }],
        },
      });

      const mapped = mapProviderStatus(provider, state.status);
      const now = new Date();
      const periodEnd = state.currentPeriodEnd ? new Date(state.currentPeriodEnd) : null;

      let status = mapped ?? subscription.status;
      let endedAt = subscription.endedAt;

      // "Cancelled but access continues until period end": when the provider reports
      // a cancelled/non_renewing state with cancel-at-period-end and the period has
      // not elapsed yet, keep access ACTIVE until the period ends.
      if (status === "CANCELLED" && state.cancelAtPeriodEnd && periodEnd && periodEnd > now) {
        status = "ACTIVE";
      }
      if ((status === "CANCELLED" || status === "EXPIRED") && !endedAt) {
        endedAt = periodEnd ?? now;
      }
      if (status === "ACTIVE" && periodEnd) {
        endedAt = null;
      }

      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: plan?.id ?? subscription.planId,
          status,
          interval: state.interval ? toInterval(state.interval) : subscription.interval,
          provider: provider,
          providerSubscriptionId: state.providerSubscriptionId,
          providerCustomerId: state.providerCustomerId ?? subscription.providerCustomerId,
          renewalDate: periodEnd ?? subscription.renewalDate,
          trialEndsAt: state.trialEnd ? new Date(state.trialEnd) : subscription.trialEndsAt,
          cancelAtPeriodEnd: state.cancelAtPeriodEnd ?? subscription.cancelAtPeriodEnd,
          endedAt,
          priceAmount: state.amount != null ? state.amount : subscription.priceAmount,
          currency: state.currency ?? subscription.currency,
        },
      });

      await tx.billingEvent.create({
        data: {
          schoolId,
          subscriptionId: subscription.id,
          provider,
          type,
          data: {
            status,
            providerStatus: state.status,
            planId: plan?.id ?? subscription.planId,
            amount: state.amount ?? null,
            currency: state.currency ?? null,
          },
        },
      });

      revalidatePath("/settings/billing");
      revalidatePath("/settings");
      revalidatePath("/admin/subscriptions");
      revalidatePath(`/admin/schools/${schoolId}`);

      return { deduplicated: false, updated: true };
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      // Same (provider, eventId) already processed — the retry is a no-op.
      return { deduplicated: true, updated: false };
    }
    throw e;
  }
}

/** Fetch the authoritative subscription state from the provider and reconcile it. */
export async function syncSubscriptionFromProvider(
  providerId: string,
  providerSubscriptionId: string,
  schoolId: string
): Promise<ApplyBillingEventResult> {
  const { getBillingProvider, isBillingConfigured } = await import("@/lib/billing");
  if (!isBillingConfigured()) {
    throw new Error("No billing provider is configured. Set BILLING_PROVIDER to enable payments.");
  }
  const provider = getBillingProvider();
  const state = await provider.getSubscription(providerSubscriptionId);
  if (state.provider !== providerId) {
    throw new Error("Subscription belongs to a different billing provider.");
  }
  return applyBillingEvent({
    provider: providerId,
    eventId: `sync-${providerSubscriptionId}-${Date.now()}`,
    type: "subscription.synced",
    schoolId,
    state,
  });
}
