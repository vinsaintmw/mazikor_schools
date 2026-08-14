"use client";

import { RouteError } from "@/components/route-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      title="Unable to load transport"
      description="Something went wrong while loading this page. Please try again."
      error={error}
      reset={reset}
    />
  );
}
