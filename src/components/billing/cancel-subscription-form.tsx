"use client";

import { useActionState } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { cancelSubscription } from "@/lib/actions/billing";
import type { ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";

type CancelResult = { atPeriodEnd: boolean };

export function CancelSubscriptionForm({ subscriptionLabel }: { subscriptionLabel: string }) {
  const [state, formAction] = useActionState<ActionResult<CancelResult> | null, FormData>(
    async () => {
      if (!window.confirm("Cancel your subscription? You keep full access until the end of the current billing period.")) {
        return null;
      }
      try {
        return await cancelSubscription();
      } catch (e) {
        console.error("Unexpected cancellation error", e);
        return { ok: false, error: "Something went wrong. Please try again." };
      }
    },
    null
  );

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="outline" size="sm">
          Cancel subscription
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        {subscriptionLabel} stays active until the end of this billing period, then access ends. Nothing is deleted.
      </p>
      {state && !state.ok ? (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
          <TriangleAlertIcon className="size-3.5" />
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          Cancellation confirmed by the provider — you keep access until the end of the current period.
        </p>
      ) : null}
    </div>
  );
}
