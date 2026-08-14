"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckCircle2Icon, CopyIcon } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/slug";
import { FormFieldErrorsProvider } from "@/components/form-field-error";
import { TextInput, NativeSelect } from "@/components/forms";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createSchoolOnboarding } from "@/lib/actions/super-admin";
import { cn } from "@/lib/utils";

const STEPS = ["School", "Plan", "Administrator", "Settings", "Review"] as const;

const SCHOOL_TYPES = ["PRIMARY", "SECONDARY", "COLLEGE", "TERTIARY", "OTHER"];
const SUB_STATUSES = ["TRIAL", "ACTIVE"];
const TIMEZONES = [
  "Africa/Blantyre",
  "Africa/Lilongwe",
  "Africa/Maputo",
  "Africa/Harare",
  "Africa/Lusaka",
  "Africa/Nairobi",
  "Africa/Kampala",
  "Africa/Dar_es_Salaam",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Lagos",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Kuala_Lumpur",
  "Asia/Manila",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "Pacific/Auckland",
];

type Plan = { id: string; name: string; priceMonthly: number; priceYearly: number };

type CreateResult = { schoolId: string; setupUrl: string };

function suggestCode(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const skip = new Set(["and", "the", "of", "a", "an", "st", "saint"]);
  const initials = words
    .filter((w) => !skip.has(w.toLowerCase()))
    .map((w) => w[0].toUpperCase())
    .join("");
  const fromName = name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
  if (!initials && !fromName) return "";
  return (initials || fromName).slice(0, 6);
}

export function CreateSchoolWizard({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [code, setCode] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);
  const [type, setType] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [currency, setCurrency] = useState("MWK");
  const [timezone, setTimezone] = useState("");
  const [planId, setPlanId] = useState("");
  const [status, setStatus] = useState("TRIAL");
  const [copied, setCopied] = useState(false);

  const [state, formAction] = useActionState<ActionResult<CreateResult> | null, FormData>(
    async (_prev, formData) => {
      try {
        return await createSchoolOnboarding(formData);
      } catch (e) {
        console.error("Unexpected create-school error", e);
        return { ok: false, error: "Something went wrong. Please try again." };
      }
    },
    null
  );

  const result = state?.ok ? (state.data as CreateResult) : null;
  const pendingRef = useRef(false);
  useEffect(() => {
    if (result && !pendingRef.current) {
      pendingRef.current = true;
      setStep(STEPS.length);
    }
    if (!result) pendingRef.current = false;
  }, [result]);

  const selectedPlan = plans.find((p) => p.id === planId);

  const goNext = () => {
    const required: string[] = [];
    if (step === 0) {
      required.push("name", "code", "slug");
    } else if (step === 1) {
      required.push("planId");
    } else if (step === 2) {
      required.push("adminName", "adminEmail");
    } else if (step === 3) {
      required.push("primaryColor", "secondaryColor");
    }
    const missing = required.some(
      (n) => !((document.querySelector(`[name="${n}"]`) as HTMLInputElement | null)?.value ?? "").trim()
    );
    if (missing) {
      setStepError("Please complete all required fields in this step before continuing.");
      return;
    }
    setStepError(null);
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };
  const goBack = () => {
    setStepError(null);
    if (step < STEPS.length) setStep((s) => s - 1);
  };

  if (result) {
    const setupLink = `${typeof window !== "undefined" ? window.location.origin : ""}${result.setupUrl}`;
    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(setupLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    };
    return (
      <div className="w-full max-w-3xl rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2Icon className="size-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">School created successfully</h2>
          <p className="text-sm text-muted-foreground">
            Send the setup link below to the administrator. It expires in 7 days and can be regenerated anytime from the
            school page.
          </p>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["School", name],
            ["Slug", slug],
            ["Code", code],
            ["Administrator", adminName],
            ["Admin email", adminEmail],
          ]
            .filter(([, v]) => Boolean(v))
            .map(([k, v]) => (
              <div key={k} className="rounded-lg border bg-muted/40 px-3 py-2">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="truncate text-sm font-medium">{v}</dd>
              </div>
            ))}
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <dt className="text-xs text-muted-foreground">Plan</dt>
            <dd className="truncate text-sm font-medium">
              {selectedPlan?.name ?? "—"} <span className="text-xs text-muted-foreground">({status.toLowerCase()})</span>
            </dd>
          </div>
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd>
              <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                ACTIVE
              </Badge>
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <label htmlFor="setup-link" className="mb-1.5 block text-sm font-medium">
            Administrator setup link
          </label>
          <div className="flex gap-2">
            <Input id="setup-link" readOnly value={setupLink} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button type="button" variant="outline" size="sm" onClick={copyLink} className="shrink-0 gap-1.5">
              <CopyIcon className="size-3.5" />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Store this link somewhere safe. It is only shown once and can be regenerated from the school page if lost.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-2 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/schools")}>
            Go to Schools
          </Button>
          <Button type="button" onClick={() => router.push(`/admin/schools/${result.schoolId}`)}>
            View School
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl">
      <ol className="mb-8 flex items-center justify-between gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "border-2 border-primary text-primary"
                    : "border border-border text-muted-foreground"
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "hidden truncate text-xs font-medium sm:block",
                i === step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? <span className="h-px flex-1 bg-border" /> : null}
          </li>
        ))}
      </ol>

      <form action={formAction} className="rounded-2xl border bg-card p-6 sm:p-8">
        <FormFieldErrorsProvider
          value={state && !state.ok ? (state.fieldErrors ?? null) : null}
        >
          {/* Step 1: School */}
          <section className={cn("space-y-4", step === 0 ? "" : "hidden")}>
            <div>
              <h2 className="text-lg font-semibold">School details</h2>
              <p className="text-sm text-muted-foreground">
                The slug and code are auto-generated but can be edited. They must be unique.
              </p>
            </div>
            <TextInput
              name="name"
              label="School name"
              placeholder="e.g. St Mary's Academy"
              required
              onChange={(e) => {
                const v = e.target.value;
                setName(v);
                if (!slugTouched) setSlug(slugify(v));
                if (!codeTouched) setCode(suggestCode(v));
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                name="slug"
                label="Slug"
                value={slug}
                required
                hint="Used in URLs, e.g. st-marys-academy"
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
              />
              <TextInput
                name="code"
                label="School code"
                value={code}
                required
                hint="Short unique code, e.g. SMA"
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setCodeTouched(true);
                }}
              />
            </div>
            <NativeSelect
              name="type"
              label="School type"
              placeholder="Select type (optional)"
              options={SCHOOL_TYPES}
              onChange={(e) => setType(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput name="address" label="Address" placeholder="e.g. P.O. Box 123, Lilongwe" />
              <TextInput name="district" label="District" placeholder="e.g. Lilongwe" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput name="region" label="Region" placeholder="e.g. Central Region" />
              <TextInput name="country" label="Country" placeholder="e.g. Malawi" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput name="phone" label="Phone" />
              <TextInput name="email" label="Email" type="email" placeholder="info@example.com" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput name="website" label="Website" placeholder="https://example.com" />
              <TextInput name="registrationNumber" label="Registration number" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput name="motto" label="Motto" />
              <TextInput name="logo" label="Logo URL" hint="Optional. Leave empty to use the default." />
            </div>
          </section>

          {/* Step 2: Plan */}
          <section className={cn("space-y-4", step === 1 ? "" : "hidden")}>
            <div>
              <h2 className="text-lg font-semibold">Subscription plan</h2>
              <p className="text-sm text-muted-foreground">
                Choose the plan this school starts on. You can change it later from the school page.
              </p>
            </div>
            <NativeSelect
              name="planId"
              label="Plan"
              placeholder="Select a plan"
              options={plans.map((p) => ({ value: p.id, label: p.name }))}
              required
              onChange={(e) => setPlanId(e.target.value)}
            />
            <NativeSelect
              name="status"
              label="Subscription status"
              options={SUB_STATUSES}
              defaultValue={status}
              hint="TRIAL grants a free 30-day period and auto-sets the renewal date."
              onChange={(e) => setStatus(e.target.value)}
            />
            {selectedPlan ? (
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {selectedPlan.name} — {selectedPlan.priceMonthly.toLocaleString()} monthly /{" "}
                {selectedPlan.priceYearly.toLocaleString()} yearly
              </div>
            ) : null}
          </section>

          {/* Step 3: Administrator */}
          <section className={cn("space-y-4", step === 2 ? "" : "hidden")}>
            <div>
              <h2 className="text-lg font-semibold">School administrator</h2>
              <p className="text-sm text-muted-foreground">
                This person will be the first administrator. They set their own password using the setup link after the
                school is created — you never see their password.
              </p>
            </div>
            <TextInput name="adminName" label="Full name" required placeholder="e.g. Grace Banda" onChange={(e) => setAdminName(e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput name="adminEmail" label="Email" type="email" required placeholder="grace@example.com" onChange={(e) => setAdminEmail(e.target.value)} />
              <TextInput name="adminPhone" label="Phone" />
            </div>
          </section>

          {/* Step 4: Settings */}
          <section className={cn("space-y-4", step === 3 ? "" : "hidden")}>
            <div>
              <h2 className="text-lg font-semibold">School settings</h2>
              <p className="text-sm text-muted-foreground">
                Branding and preferences. The academic year is optional — you can leave it for the administrator to set
                up through onboarding.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput name="primaryColor" label="Primary colour" type="color" defaultValue="#1d4ed8" required />
              <TextInput name="secondaryColor" label="Secondary colour" type="color" defaultValue="#059669" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                name="currency"
                label="Currency code"
                defaultValue="MWK"
                hint="e.g. MWK"
                onChange={(e) => setCurrency(e.target.value)}
              />
              <TextInput name="currencySymbol" label="Currency symbol" defaultValue="MK" hint="e.g. MK" />
            </div>
            <NativeSelect
              name="timezone"
              label="Timezone"
              placeholder="Select timezone (optional)"
              options={TIMEZONES}
              onChange={(e) => setTimezone(e.target.value)}
            />
            <div className="rounded-xl border p-4">
              <h3 className="text-sm font-medium">Academic year (optional)</h3>
              <p className="mb-4 mt-1 text-xs text-muted-foreground">
                Setting one up here lets the administrator skip onboarding. Leave blank otherwise.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <TextInput name="ayName" label="Year name" placeholder="e.g. 2026" />
                <TextInput name="ayStart" label="Start date" type="date" />
                <TextInput name="ayEnd" label="End date" type="date" />
              </div>
            </div>
          </section>

          {/* Step 5: Review */}
          <section className={cn("space-y-4", step === 4 ? "" : "hidden")}>
            <div>
              <h2 className="text-lg font-semibold">Review and create</h2>
              <p className="text-sm text-muted-foreground">Confirm the details below before creating the school.</p>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["School name", name],
                ["Slug", slug],
                ["Code", code],
                ["Type", type || "—"],
                ["Administrator", adminName || "—"],
                ["Admin email", adminEmail || "—"],
                ["Plan", selectedPlan?.name ?? "—"],
                ["Status", status.toLowerCase()],
                ["Currency", currency || "—"],
                ["Timezone", timezone || "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border bg-muted/40 px-3 py-2">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="truncate text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {stepError ? (
            <p role="alert" className="mt-4 text-sm font-medium text-destructive">
              {stepError}
            </p>
          ) : null}

          {state && !state.ok ? (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <span className="mt-0.5 shrink-0 text-destructive">!</span>
              <div className="space-y-0.5">
                {state.error ? <p>{state.error}</p> : null}
                {state.fieldErrors ? (
                  <ul className="list-disc space-y-0.5 pl-4">
                    {Object.values(state.fieldErrors).map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-4 border-t pt-6">
            <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
              <ArrowLeftIcon className="size-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext}>
                Next <ArrowRightIcon className="size-4" />
              </Button>
            ) : (
              <SubmitButton pendingLabel="Creating school…" className="gap-2">
                Create school
              </SubmitButton>
            )}
          </div>
        </FormFieldErrorsProvider>
      </form>
    </div>
  );
}
