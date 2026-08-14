"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

export function RouteError({
  title,
  description,
  reset,
  error,
}: {
  title: string;
  description: string;
  reset?: () => void;
  error?: unknown;
}) {
  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  return <ErrorState title={title} description={description} onRetry={reset} />;
}
