import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
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
  const body = (
    <Card className={cn("h-full", href && "transition-colors hover:bg-muted/40 cursor-pointer")}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-value">{value}</p>
          {sub ? <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10", tone)}
            aria-hidden="true"
          >
            {icon}
          </span>
          {href ? <ArrowRightIcon className="size-3.5 text-muted-foreground/70" /> : null}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {body}
      </Link>
    );
  }
  return body;
}
