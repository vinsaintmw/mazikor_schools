import Link from "next/link";
import { TriangleAlertIcon, ClockIcon } from "lucide-react";
import type { SubscriptionAccessState } from "@/lib/billing";
import { cn } from "@/lib/utils";

/**
 * Shown across the app (dashboard, settings) when subscription access is not fully
 * active: warns during grace / at period end, and blocks with a notice when
 * restricted (past due / expired). "Ending" here is handled by the period-end banner.
 */
export function SubscriptionBanner({ state }: { state: SubscriptionAccessState }) {
  if (state.access === "full") return null;

  const restricted = state.access === "restricted";
  const reason = state.message;

  return (
    <div
      role={restricted ? "alert" : undefined}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-3",
        restricted
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200"
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {restricted ? <TriangleAlertIcon className="size-4 shrink-0" /> : <ClockIcon className="size-4 shrink-0" />}
        <span>{reason ?? "Your subscription is not fully active."}</span>
      </div>
      <Link
        href="/settings/billing"
        className={cn(
          "shrink-0 text-xs font-semibold underline underline-offset-2",
          restricted ? "text-destructive hover:text-destructive/80" : "text-amber-800 hover:text-amber-950 dark:text-amber-200 dark:hover:text-amber-100"
        )}
      >
        Review billing
      </Link>
    </div>
  );
}
