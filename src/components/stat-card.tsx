import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon,
  label,
  value,
  sub,
  href,
  tone = "text-primary",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  href?: string;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {sub ? <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        {icon ? (
          href ? (
            <Link
              href={href}
              className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors hover:bg-primary/20", tone)}
              aria-label={label}
            >
              {icon}
            </Link>
          ) : (
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10", tone)}>{icon}</div>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
