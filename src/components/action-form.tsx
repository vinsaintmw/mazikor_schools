"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2Icon, TriangleAlertIcon } from "lucide-react";
import { unwrapAction } from "@/lib/action-result";
import { FormFieldErrorsProvider } from "@/components/form-field-error";

type FormFeedback = { ok: boolean; error?: string; fieldErrors?: Record<string, string> } | null;

export function ActionForm({
  action,
  className,
  children,
  successLabel = "Saved successfully",
  onSuccess,
}: {
  action: (formData: FormData) => Promise<unknown>;
  className?: string;
  children: React.ReactNode;
  successLabel?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState<FormFeedback, FormData>(
    async (_prev, formData) => {
      try {
        const result = await action(formData);
        const unwrapped = unwrapAction(result);
        return unwrapped.ok
          ? { ok: true }
          : { ok: false, error: unwrapped.error, fieldErrors: unwrapped.fieldErrors };
      } catch (e) {
        console.error("Unexpected form error", e);
        return { ok: false, error: "Something went wrong. Please try again." };
      }
    },
    null
  );

  const prevOkRef = useRef(false);
  useEffect(() => {
    if (state?.ok && !prevOkRef.current) onSuccess?.();
    prevOkRef.current = Boolean(state?.ok);
  }, [state, onSuccess]);

  const fieldErrors = state?.ok ? null : state?.fieldErrors ?? null;
  const fieldErrorMessages = fieldErrors ? Object.values(fieldErrors) : [];

  return (
    <form action={formAction} className={className}>
      <FormFieldErrorsProvider value={fieldErrors}>
        {children}
        {state ? (
          <div className="w-full [grid-column:1/-1]">
            {state.ok ? (
              <p
                role="status"
                className="flex items-center gap-2 rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"
              >
                <CheckCircle2Icon className="size-4 shrink-0" />
                {successLabel}
              </p>
            ) : (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-1">
                  {state.error ? <p>{state.error}</p> : null}
                  {fieldErrorMessages.length ? (
                    <ul className="list-disc space-y-0.5 pl-4">
                      {fieldErrorMessages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </FormFieldErrorsProvider>
    </form>
  );
}
