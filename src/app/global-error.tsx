"use client";

import { useEffect } from "react";
import { TriangleAlertIcon } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10">
            <TriangleAlertIcon className="size-6 text-destructive" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
          </div>
          <button
            onClick={reset}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
