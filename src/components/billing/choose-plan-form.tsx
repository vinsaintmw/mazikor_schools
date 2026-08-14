"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2Icon, TriangleAlertIcon, StarIcon } from "lucide-react";
import { startSubscriptionCheckout } from "@/lib/actions/billing";
import type { ActionResult } from "@/lib/action-result";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SubmitButton } from "@/components/submit-button";

export type BillingIntervalValue = "monthly" | "yearly";

export interface BillingPlanOption {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  limits: string;
  isCurrent: boolean;
  isPopular: boolean;
}

type CheckoutResult = { changed: boolean; checkoutUrl: string | null };

export function ChoosePlanForm({
  plans,
  currentPlanId,
  initialInterval,
  enabled,
}: {
  plans: BillingPlanOption[];
  currentPlanId?: string | null;
  initialInterval: BillingIntervalValue;
  enabled: boolean;
}) {
  const [interval, setInterval] = useState<BillingIntervalValue>(initialInterval);
  const [state, formAction] = useActionState<ActionResult<CheckoutResult> | null, FormData>(
    async (_prev, formData) => {
      try {
        return await startSubscriptionCheckout(formData);
      } catch (e) {
        console.error("Unexpected billing error", e);
        return { ok: false, error: "Something went wrong. Please try again." };
      }
    },
    null
  );

  useEffect(() => {
    if (state?.ok && state.data?.checkoutUrl) {
      window.location.href = state.data.checkoutUrl;
    }
  }, [state]);

  return (
    <div className="space-y-4">
      {!enabled ? (
        <p className="rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
          Online checkout is not configured yet. To change plans, contact the platform team.
        </p>
      ) : (
        <div className="flex items-center justify-center gap-3">
          <span className={cn("text-sm font-medium", interval === "monthly" ? "text-foreground" : "text-muted-foreground")}>
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={interval === "yearly"}
            aria-label="Toggle annual billing"
            onClick={() => setInterval((v) => (v === "yearly" ? "monthly" : "yearly"))}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              interval === "yearly" ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow transition-transform",
                interval === "yearly" && "translate-x-5"
              )}
            />
          </button>
          <span className={cn("text-sm font-medium", interval === "yearly" ? "text-foreground" : "text-muted-foreground")}>
            Annual
            <span className="ml-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Save 13%
            </span>
          </span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const price = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
          const custom = plan.priceMonthly === 0;
          return (
            <form
              key={plan.id}
              action={formAction}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-5",
                isCurrent ? "border-primary/60 ring-1 ring-primary/40" : plan.isPopular ? "border-primary shadow-lg shadow-primary/5" : "shadow-sm"
              )}
            >
              {plan.isPopular ? (
                <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  <StarIcon className="size-3" />
                  Most popular
                </span>
              ) : null}

              <input type="hidden" name="planId" value={plan.id} />
              <input type="hidden" name="interval" value={interval} />

              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold">{plan.name}</h3>
                {isCurrent ? <CheckCircle2Icon className="size-4 text-emerald-600" aria-label="Current plan" /> : null}
              </div>
              <p className="mt-1 min-h-8 text-sm text-muted-foreground">{plan.description}</p>

              <div className="mt-4 flex items-baseline gap-1">
                {custom ? (
                  <span className="text-2xl font-bold tracking-tight">Custom</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold tracking-tight tabular-nums">{formatMoney(price, plan.currency)}</span>
                    <span className="text-xs text-muted-foreground">{interval === "yearly" ? "/yr" : "/mo"}</span>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {custom
                  ? "Tailored pricing for districts and large campuses"
                  : interval === "yearly"
                    ? "Billed annually"
                    : "Billed monthly · cancel anytime"}
              </p>

              <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">{plan.limits}</p>

              <div className="mt-4 flex-1" />

              {isCurrent ? (
                <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-center text-sm font-medium text-muted-foreground">Current plan</p>
              ) : enabled ? (
                <SubmitButton
                  className="mt-4 w-full"
                  size="sm"
                  variant={plan.isPopular ? "default" : "outline"}
                  pendingLabel={plan.isPopular ? "Starting…" : "Switching…"}
                >
                  {plan.isPopular ? "Choose this plan" : "Switch to this plan"}
                </SubmitButton>
              ) : (
                <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-center text-sm font-medium text-muted-foreground">
                  Managed by the platform team
                </p>
              )}
            </form>
          );
        })}
      </div>

      {state && !state.ok ? (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <TriangleAlertIcon className="size-3.5" />
          {state.error}
        </p>
      ) : null}
      {state?.ok && state.data?.changed ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2Icon className="size-3.5" />
          Plan change confirmed by the provider. It may take a moment to appear.
        </p>
      ) : null}
    </div>
  );
}
