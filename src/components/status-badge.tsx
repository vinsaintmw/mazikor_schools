import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/constants";

const TONES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  PAID: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  APPROVED: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  PRESENT: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  RETURNED: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  PUBLISHED: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  GOOD: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  PENDING: "bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  PARTIALLY_PAID: "bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  OVERDUE: "bg-orange-500/15 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
  LATE: "bg-orange-500/15 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
  ON_LEAVE: "bg-sky-500/15 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  EXCUSED: "bg-sky-500/15 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  BORROWED: "bg-sky-500/15 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  TRIAL: "bg-sky-500/15 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  SUSPENDED: "bg-rose-500/15 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
  REJECTED: "bg-rose-500/15 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
  ABSENT: "bg-rose-500/15 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
  TERMINATED: "bg-rose-500/15 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
  EXPIRED: "bg-rose-500/15 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
  CANCELLED: "bg-rose-500/15 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
  FAIL: "bg-rose-500/15 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
  WITHDRAWN: "bg-zinc-500/15 text-zinc-700 dark:bg-zinc-400/15 dark:text-zinc-300",
  TRANSFERRED: "bg-zinc-500/15 text-zinc-700 dark:bg-zinc-400/15 dark:text-zinc-300",
  RESIGNED: "bg-zinc-500/15 text-zinc-700 dark:bg-zinc-400/15 dark:text-zinc-300",
  GRADUATED: "bg-violet-500/15 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
  DRAFT: "bg-zinc-500/15 text-zinc-700 dark:bg-zinc-400/15 dark:text-zinc-300",
  UNPAID: "bg-rose-500/15 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
};

export function StatusBadge({
  status,
  className,
  children,
}: {
  status: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Badge variant="outline" className={cn(TONES[status] ?? "bg-muted text-muted-foreground", className)}>
      {children ?? titleCase(status.replace(/_/g, " "))}
    </Badge>
  );
}
