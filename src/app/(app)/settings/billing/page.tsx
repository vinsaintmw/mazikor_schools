import { redirect } from "next/navigation";
import { CreditCardIcon, RefreshCwIcon, InfoIcon, GaugeIcon, ShieldCheckIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { formatDate, formatMoney } from "@/lib/format";
import { titleCase } from "@/lib/constants";
import { getEffectiveLimits } from "@/lib/limits";
import {
  getSubscriptionAccess,
  getGracePeriodDays,
  isBillingConfigured,
  getConfiguredBillingProviderId,
  planPriceForInterval,
} from "@/lib/billing";
import { refreshSubscriptionFromProvider } from "@/lib/actions/billing";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { ChoosePlanForm, type BillingIntervalValue, type BillingPlanOption } from "@/components/billing/choose-plan-form";
import { CancelSubscriptionForm } from "@/components/billing/cancel-subscription-form";

export const metadata = { title: "Billing & Subscription" };

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

function LimitRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const unlimited = limit == null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return (
    <div className="py-2 text-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used.toLocaleString()} / {unlimited ? "Unlimited" : limit.toLocaleString()}
        </span>
      </div>
      {!unlimited ? (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} aria-hidden />
        </div>
      ) : null}
    </div>
  );
}

export default async function BillingSettingsPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!can(session, "settings.view")) redirect("/dashboard");
  const schoolId = getSchoolId(session);

  const [school, subscription, plans, limits, studentCount, teacherCount, staffCount] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId } }),
    db.subscription.findUnique({ where: { schoolId }, include: { plan: true } }),
    db.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getEffectiveLimits(schoolId),
    db.student.count({ where: { schoolId } }),
    db.teacher.count({ where: { schoolId } }),
    db.staff.count({ where: { schoolId } }),
  ]);

  if (!school) {
    return (
      <EmptyState
        title="School profile missing"
        description="No school record was found for this account."
        icon={<CreditCardIcon className="size-6" />}
      />
    );
  }

  const canManage = can(session, "settings.manage");
  const providerConfigured = isBillingConfigured();
  const configuredProvider = getConfiguredBillingProviderId();
  const graceDays = getGracePeriodDays();
  const access = subscription
    ? getSubscriptionAccess(subscription, new Date(), graceDays)
    : { access: "restricted" as const, restricted: true, message: "No subscription is linked to this school. Choose a plan below." };

  const subscriptionPlan = subscription?.plan ?? null;
  const interval: BillingIntervalValue = subscription?.interval === "YEARLY" ? "yearly" : "monthly";

  const planOptions: BillingPlanOption[] = plans.map((plan) => {
    const priceMonthly = plan.priceMonthly.toNumber();
    const priceYearly = plan.priceYearly.toNumber();
    const custom = priceMonthly === 0;
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly,
      priceYearly,
      currency: plan.currency || "MWK",
      limits: custom
        ? "Custom limits for your district or campus"
        : `Up to ${plan.maxStudents.toLocaleString()} students · ${plan.maxTeachers.toLocaleString()} teachers · ${plan.maxStaff.toLocaleString()} staff · ${plan.maxStorageGB} GB storage`,
      isCurrent: subscriptionPlan?.id === plan.id,
      isPopular: plan.name === "Professional",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & subscription" description="Your plan, payment status and access" />

      <SubscriptionBanner state={access} />

      {!providerConfigured ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            Online payments are not enabled yet. Plan changes and subscriptions are currently handled by the platform team —
            contact support to upgrade or downgrade. Nothing here is fake: billing will be wired to a payment provider in a
            future release.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="size-4" />
              Current subscription
            </CardTitle>
            <CardDescription>Status is synced from the billing provider and cannot be changed from the browser</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {subscription ? (
              <>
                <InfoRow label="Plan" value={subscriptionPlan?.name} />
                <div className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={subscription.status} />
                </div>
                <InfoRow
                  label="Price"
                  value={
                    subscription.priceAmount != null
                      ? formatMoney(subscription.priceAmount, subscription.currency)
                      : subscriptionPlan
                        ? formatMoney(planPriceForInterval(subscriptionPlan, interval), subscriptionPlan.currency)
                        : null
                  }
                />
                <InfoRow label="Billing" value={titleCase(subscription.interval.toLowerCase())} />
                <InfoRow label="Started" value={formatDate(subscription.startDate)} />
                <InfoRow
                  label="Renews / period end"
                  value={subscription.renewalDate ? formatDate(subscription.renewalDate) : null}
                />
                {subscription.trialEndsAt ? (
                  <InfoRow label="Trial ends" value={formatDate(subscription.trialEndsAt)} />
                ) : null}
                {subscription.cancelAtPeriodEnd ? (
                  <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                    Cancellation requested — access continues until the end of the current billing period.
                  </p>
                ) : null}

                {canManage ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t pt-3">
                    {providerConfigured && subscription.providerSubscriptionId ? (
                      <>
                        {subscription.cancelAtPeriodEnd ? (
                          <p className="text-sm text-muted-foreground">
                            Renewal is scheduled to end after {subscription.renewalDate ? formatDate(subscription.renewalDate) : "this period"}.
                          </p>
                        ) : (
                          <CancelSubscriptionForm
                            subscriptionLabel={
                              subscriptionPlan ? `${subscriptionPlan.name} plan` : "Your subscription"
                            }
                          />
                        )}
                        <form action={async () => { await refreshSubscriptionFromProvider(); }}>
                          <button
                            type="submit"
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <RefreshCwIcon className="size-3.5" />
                            Sync from provider
                          </button>
                        </form>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">
                No subscription yet. Choose a plan below to get started.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <GaugeIcon className="size-4" />
              Plan usage
            </CardTitle>
            <CardDescription>Current usage against your plan&apos;s limits</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <LimitRow label="Students" used={studentCount} limit={limits.maxStudents} />
            <LimitRow label="Teachers" used={teacherCount} limit={limits.maxTeachers} />
            <LimitRow label="Staff" used={staffCount} limit={limits.maxStaff} />
            <div className="border-t pt-2">
              <InfoRow label="Storage" value={limits.maxStorageGB != null ? `${limits.maxStorageGB} GB` : "Unlimited"} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4" />
            Choose a plan
          </CardTitle>
          <CardDescription>
            Prices shown are the official plan prices. Billing is handled securely by our payment provider
            {configuredProvider ? ` (${configuredProvider})` : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ChoosePlanForm
            plans={planOptions}
            currentPlanId={subscription?.planId ?? null}
            initialInterval={interval}
            enabled={providerConfigured && canManage}
          />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Payments are processed by a third-party billing provider. Subscription status updates are verified server-side from
        provider webhooks — the page never trusts a browser redirect. Your payment details never touch this application.
      </p>
    </div>
  );
}
