"use client";

import { useCallback, useState } from "react";
import type { ActionResult } from "@/lib/action-result";

type ActionFn<P extends unknown[]> = (...args: P) => Promise<ActionResult>;

export function useAction<P extends unknown[]>(
  action: ActionFn<P>,
  options?: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
  }
) {
  const [state, setState] = useState<ActionResult | null>(null);
  const [isPending, setIsPending] = useState(false);

  const run = useCallback(
    async (...args: P) => {
      setIsPending(true);
      setState(null);
      try {
        const result = await action(...args);
        setState(result);
        if (result.ok) {
          options?.onSuccess?.();
        } else {
          options?.onError?.(result.error);
        }
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "An unexpected error occurred";
        const err: ActionResult = { ok: false, error: msg };
        setState(err);
        options?.onError?.(msg);
        return err;
      } finally {
        setIsPending(false);
      }
    },
    [action, options]
  );

  return { state, isPending, run };
}
