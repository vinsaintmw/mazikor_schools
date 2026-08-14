"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MessageSquareIcon,
  CheckCircle2Icon,
  Loader2Icon,
  ArrowRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/form-error";
import { cn } from "@/lib/utils";

const demoRequestSchema = z.object({
  schoolName: z.string().trim().min(2, "Enter your school name").max(120),
  contactPerson: z.string().trim().min(2, "Enter the contact person's name").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+()\d\s-]+$/, "Phone number contains invalid characters"),
  email: z.string().trim().email("Enter a valid email address"),
  numStudents: z.coerce
    .number({ message: "Enter the number of students" })
    .int("Enter a whole number")
    .min(1, "Enter at least 1 student")
    .max(1000000, "That number looks too large"),
  message: z.string().trim().max(2000, "Message must be under 2000 characters").optional().default(""),
});

type DemoRequestInput = z.input<typeof demoRequestSchema>;
type DemoRequestOutput = z.output<typeof demoRequestSchema>;

export function DemoForm() {
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DemoRequestInput, object, DemoRequestOutput>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: {
      schoolName: "",
      contactPerson: "",
      phone: "",
      email: "",
      numStudents: undefined,
      message: "",
    },
  });

  async function onSubmit(values: DemoRequestOutput) {
    setServerError("");
    try {
      const response = await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = (await response.json().catch(() => null)) as
        | { success: boolean; error?: string }
        | null;

      if (!response.ok || !data?.success) {
        setServerError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      reset();
      setSubmitted(true);
      window.setTimeout(() => setSubmitted(false), 12000);
    } catch {
      setServerError("Unable to reach the server. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border bg-card p-8 shadow-sm sm:p-10" role="status">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <CheckCircle2Icon className="size-7" />
          </span>
          <h3 className="mt-4 text-xl font-semibold">Request received</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Thank you for your interest in Mazikor Schools. A member of our team will get in touch with
            you shortly to arrange your demo.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
            Submit another request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FieldShell label="School name" required error={errors.schoolName?.message}>
          <Input
            {...register("schoolName")}
            placeholder="e.g. Lilongwe Academy"
            aria-invalid={!!errors.schoolName}
          />
        </FieldShell>

        <FieldShell label="Contact person" required error={errors.contactPerson?.message}>
          <Input
            {...register("contactPerson")}
            placeholder="Full name"
            aria-invalid={!!errors.contactPerson}
          />
        </FieldShell>

        <FieldShell label="Phone" required error={errors.phone?.message}>
          <Input
            {...register("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+265 99 000 0000"
            aria-invalid={!!errors.phone}
          />
        </FieldShell>

        <FieldShell label="Email" required error={errors.email?.message}>
          <Input
            {...register("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@school.mw"
            aria-invalid={!!errors.email}
          />
        </FieldShell>

        <FieldShell label="Number of students" required error={errors.numStudents?.message}>
          <Input
            {...register("numStudents")}
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="e.g. 350"
            aria-invalid={!!errors.numStudents}
          />
        </FieldShell>

        <div className="sm:col-span-2">
          <FieldShell label="Message" error={errors.message?.message}>
            <textarea
              {...register("message")}
              rows={4}
              placeholder="Tell us about your school and what you need (optional)"
              className="w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30"
            />
          </FieldShell>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <FormError message={serverError} />
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full" data-icon="inline-end">
          {isSubmitting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <MessageSquareIcon className="size-4" />
          )}
          {isSubmitting ? "Sending…" : "Request a demo"}
          <ArrowRightIcon data-icon="inline-end" className="size-4" />
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          No obligation — we&apos;ll only use your details to arrange the demo.
        </p>
      </div>
    </form>
  );
}

function FieldShell({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
      <p className={cn("min-h-4 text-xs text-destructive", !error && "invisible")} aria-live="polite">
        {error ?? "."}
      </p>
    </div>
  );
}
