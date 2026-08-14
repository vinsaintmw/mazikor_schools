"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId, toStr, enumOf } from "@/lib/server-helpers";
import { error, success } from "@/lib/action-result";
import { auditor } from "@/lib/audit";
import {
  getBillingProvider,
  isBillingConfigured,
  planPriceForInterval,
  providerPlanRef,
} from "@/lib/billing";
import { applyBillingEvent } from "@/lib/billing-webhooks";
import { SITE_URL } from "@/lib/constants";

const INTERVALS = ["monthly", "yearly"] as const;

async function requireSchoolManager() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!can(session, "settings.manage")) {
    throw new Error("You do not have permission to manage billing.");
  }
  const schoolId = getSchoolId(session);
  return { session, schoolId };
}

function requireConfigured() {
  if (!isBillingConfigured()) {
    return error(
      "Online billing is not configured on this platform yet. Subscriptions are managed by the platform team — contact support."
    );
  }
  return null;
}

/**
 * Starts checkout for a plan, or changes the plan when the school already has an
 * online subscription.
 *
 * The subscription is only ever marked `INCOMPLETE` here (or left at its current
 * status for a plan change). It is NEVER marked ACTIVE — activation comes exclusively
 * from the provider webhook after payment succeeds.
 */
export async function startSubscriptionCheckout(formData: FormData) {
  const { session, schoolId } = await requireSchoolManager();
  const notConfigured = requireConfigured();
  if (notConfigured) return notConfigured;

  const planId = toStr(formData.get("planId"));
  const interval = enumOf(toStr(formData.get("interval")) || "monthly", INTERVALS, "monthly");

  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) return error("The selected plan is not available", { planId: "Select a valid plan" });

  const planRef = providerPlanRef(plan, interval);
  if (!planRef) {
    return error("This plan is not set up for online billing yet. Contact support.");
  }

  const subscription = await db.subscription.findUnique({ where: { schoolId } });
  const provider = getBillingProvider();
  const priceAmount = planPriceForInterval(plan, interval);

  const changeExisting =
    subscription?.providerSubscriptionId && ["TRIAL", "ACTIVE", "PAST_DUE"].includes(subscription.status);

  if (changeExisting) {
    // ---- Plan change (upgrade / downgrade) ------------------------------
    // The provider handles proration and rebilling; we only trust its confirmation.
    const result = await provider.changePlan({
      subscriptionId: subscription.providerSubscriptionId!,
      planRef,
      interval,
    });
    if (!result.ok) {
      return error("The billing provider could not process the plan change. No change was made.");
    }

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: plan.id,
        interval: interval === "yearly" ? "YEARLY" : "MONTHLY",
        priceAmount,
        currency: plan.currency || "MWK",
      },
    });
    await db.billingEvent.create({
      data: {
        schoolId,
        subscriptionId: subscription.id,
        provider: provider.id,
        type: "plan.changed",
        data: { planId: plan.id, planName: plan.name, interval, amount: priceAmount, currency: plan.currency || "MWK" },
      },
    });
    await auditor(session).log({
      action: "UPDATE",
      entity: "subscription",
      entityId: subscription.id,
      details: { event: "plan-change-confirmed", planId: plan.id, interval },
    });
    revalidatePath("/settings/billing");
    revalidatePath("/settings");
    revalidatePath("/admin/subscriptions");
    return success({ changed: true, checkoutUrl: null as string | null });
  }

  // ---- New checkout ------------------------------------------------------
  const school = await db.school.findUnique({ where: { id: schoolId } });
  if (!school) return error("School not found");

  let customerId = subscription?.providerCustomerId ?? null;
  if (!customerId) {
    const customer = await provider.createCustomer({
      schoolId,
      name: school.name,
      email: school.email,
      phone: school.phone,
      currency: plan.currency || "MWK",
    });
    customerId = customer.id;
  }

  const created = await provider.createSubscription({
    customerId,
    planRef,
    interval,
    metadata: { schoolId, planId: plan.id, schoolName: school.name },
  });

  let subId = subscription?.id ?? "";
  if (subscription) {
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: plan.id,
        interval: interval === "yearly" ? "YEARLY" : "MONTHLY",
        status: "INCOMPLETE",
        provider: provider.id,
        providerCustomerId: customerId,
        providerSubscriptionId: created.id,
        priceAmount,
        currency: plan.currency || "MWK",
      },
    });
  } else {
    const createdSub = await db.subscription.create({
      data: {
        schoolId,
        planId: plan.id,
        interval: interval === "yearly" ? "YEARLY" : "MONTHLY",
        status: "INCOMPLETE",
        provider: provider.id,
        providerCustomerId: customerId,
        providerSubscriptionId: created.id,
        priceAmount,
        currency: plan.currency || "MWK",
      },
    });
    subId = createdSub.id;
  }

  const checkout = await provider.createCheckout({
    schoolId,
    subscriptionId: subId,
    planId: plan.id,
    interval,
    returnUrl: `${SITE_URL}/settings/billing`,
  });

  await db.billingEvent.create({
    data: {
      schoolId,
      subscriptionId: subId || null,
      provider: provider.id,
      type: "checkout.started",
      data: { planId: plan.id, planName: plan.name, interval, amount: priceAmount, reference: checkout.reference },
    },
  });
  await auditor(session).log({
    action: "CREATE",
    entity: "subscription",
    entityId: subId || undefined,
    details: { event: "checkout-started", planId: plan.id, interval },
  });

  revalidatePath("/settings/billing");
  revalidatePath("/admin/subscriptions");
  return success({ changed: false, checkoutUrl: checkout.url });
}

/**
 * Cancels a subscription at the end of the current billing period.
 *
 * We only record `cancelAtPeriodEnd` after the provider confirms the cancellation.
 * The subscription stays active until the period ends; the webhook moves it to
 * CANCELLED/EXPIRED. No data is destroyed.
 */
export async function cancelSubscription() {
  const { session, schoolId } = await requireSchoolManager();
  const notConfigured = requireConfigured();
  if (notConfigured) return notConfigured;

  const subscription = await db.subscription.findUnique({ where: { schoolId } });
  if (!subscription || !subscription.providerSubscriptionId) {
    return error("There is no online subscription to cancel.");
  }

  const provider = getBillingProvider();
  const result = await provider.cancelSubscription({
    schoolId,
    subscriptionId: subscription.providerSubscriptionId,
    atPeriodEnd: true,
  });
  if (!result.ok) {
    return error("The billing provider did not confirm the cancellation. No change was made.");
  }

  await db.subscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: result.atPeriodEnd },
  });
  await db.billingEvent.create({
    data: {
      schoolId,
      subscriptionId: subscription.id,
      provider: provider.id,
      type: "subscription.cancelled",
      data: { atPeriodEnd: result.atPeriodEnd },
    },
  });
  await auditor(session).log({
    action: "CANCEL",
    entity: "subscription",
    entityId: subscription.id,
    details: { atPeriodEnd: result.atPeriodEnd },
  });

  revalidatePath("/settings/billing");
  revalidatePath("/admin/subscriptions");
  return success({ atPeriodEnd: result.atPeriodEnd });
}

/**
 * Fetches the authoritative subscription state from the provider and reconciles the
 * local row. Used to verify status after checkout or while investigating a
 * discrepancy. Never trusts the browser.
 */
export async function refreshSubscriptionFromProvider() {
  const { session, schoolId } = await requireSchoolManager();
  const notConfigured = requireConfigured();
  if (notConfigured) return notConfigured;

  const subscription = await db.subscription.findUnique({ where: { schoolId } });
  if (!subscription || !subscription.providerSubscriptionId) {
    return error("There is no online subscription to refresh.");
  }

  const provider = getBillingProvider();
  const state = await provider.getSubscription(subscription.providerSubscriptionId);
  if (state.provider !== subscription.provider) {
    return error("This subscription belongs to a different billing provider.");
  }

  const result = await applyBillingEvent({
    provider: subscription.provider,
    eventId: `sync-${subscription.providerSubscriptionId}-${Date.now()}`,
    type: "subscription.synced",
    schoolId,
    state,
  });

  await auditor(session).log({
    action: "READ",
    entity: "subscription",
    entityId: subscription.id,
    details: { event: "provider-sync", provider: state.provider, status: state.status },
  });
  revalidatePath("/settings/billing");
  revalidatePath("/admin/subscriptions");
  return success({ synced: true, deduplicated: result.deduplicated });
}
