"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2Icon, CopyIcon, KeyRoundIcon, TriangleAlertIcon } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import { createSetupLink } from "@/lib/actions/super-admin";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SetupLinkResult = { setupUrl: string };

export function SetupLinkForm({
  schoolId,
  adminEmail,
  adminName,
  compact,
}: {
  schoolId: string;
  adminEmail: string;
  adminName: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [state, formAction] = useActionState<ActionResult<SetupLinkResult> | null, FormData>(
    async (_prev, formData) => {
      try {
        return await createSetupLink(formData);
      } catch (e) {
        console.error("Unexpected setup-link error", e);
        return { ok: false, error: "Something went wrong. Please try again." };
      }
    },
    null
  );

  const link = state?.ok ? (state.data as SetupLinkResult).setupUrl : null;
  const displayed = link ? `${typeof window !== "undefined" ? window.location.origin : ""}${link}` : null;

  const copyLink = async () => {
    if (!displayed) return;
    try {
      await navigator.clipboard.writeText(displayed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const copyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (link && copyRef.current) copyRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [link]);

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <input type="hidden" name="schoolId" value={schoolId} />
        <input type="hidden" name="email" value={adminEmail} />
        <input type="hidden" name="name" value={adminName} />
        <div className="flex flex-wrap items-center gap-2">
          <SubmitButton variant="outline" size="sm" pendingLabel="Generating…" className="gap-1.5">
            <KeyRoundIcon className="size-3.5" />
            Generate setup link
          </SubmitButton>
          {state && !state.ok ? (
            <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-destructive">
              <TriangleAlertIcon className="size-3.5" />
              {state.error}
            </p>
          ) : null}
        </div>
      </form>

      {displayed ? (
        <div ref={copyRef} className="rounded-lg border bg-muted/40 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2Icon className="size-3.5" />
            Setup link generated (valid 7 days)
          </p>
          <div className="flex gap-2">
            <Input readOnly value={displayed} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button type="button" variant="outline" size="sm" onClick={copyLink} className="shrink-0 gap-1.5">
              <CopyIcon className="size-3.5" />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Only the link shown here works — it cannot be retrieved later. Generate a new one if it is lost.
          </p>
        </div>
      ) : compact ? null : (
        <p className="text-xs text-muted-foreground">
          The administrator uses this link to set their own password. No password is stored on this side.
        </p>
      )}
    </div>
  );
}
