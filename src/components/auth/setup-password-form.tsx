"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { FormFieldErrorsProvider } from "@/components/form-field-error";
import { TextInput } from "@/components/forms";
import { SubmitButton } from "@/components/submit-button";
import { setInvitedPassword } from "@/lib/actions/super-admin";

export function SetupPasswordForm({
  token,
  name,
  email,
}: {
  token: string;
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<{ ok: boolean; error?: string; fieldErrors?: Record<string, string> } | null, FormData>(
    async (_prev, formData) => {
      try {
        const result = await setInvitedPassword(formData);
        if (result.ok) return { ok: true };
        return { ok: false, error: result.error, fieldErrors: result.fieldErrors };
      } catch (e) {
        console.error("Unexpected setup error", e);
        return { ok: false, error: "Something went wrong. Please try again." };
      }
    },
    null
  );

  const successRef = useRef(false);
  useEffect(() => {
    if (state?.ok && !successRef.current) {
      successRef.current = true;
      router.push("/login");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border bg-card p-6 sm:p-8">
      <input type="hidden" name="token" value={token} />
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Set your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You are setting up the administrator account for your school. The invite was sent to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>

      <FormFieldErrorsProvider value={state && !state.ok ? (state.fieldErrors ?? null) : null}>
        <TextInput name="name" label="Full name" defaultValue={name} required />
        <TextInput name="phone" label="Phone (optional)" />
        <TextInput name="password" label="Password" type="password" required hint="At least 8 characters" />
        <TextInput name="confirmPassword" label="Confirm password" type="password" required />
      </FormFieldErrorsProvider>

      {state && !state.ok ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Saving…" className="w-full">
        Set password and sign in
      </SubmitButton>
    </form>
  );
}
