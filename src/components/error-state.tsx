import { TriangleAlertIcon } from "lucide-react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-16 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlertIcon className="size-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <div className="text-base font-semibold">{title}</div>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button onClick={onRetry} variant="outline" className="mt-1">
          <RefreshCwIcon />
          Try Again
        </Button>
      ) : null}
    </div>
  );
}
