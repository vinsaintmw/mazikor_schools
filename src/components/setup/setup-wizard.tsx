"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { TextInput, NativeSelect } from "@/components/forms";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { completeSetup } from "@/lib/actions/onboarding";
import { cn } from "@/lib/utils";

const STEPS = ["School", "Academic year", "Classes", "Subjects", "Fees"] as const;

let rowSeq = 0;
function nextRowKey() {
  rowSeq += 1;
  return rowSeq;
}

export function SetupWizard({ schoolName, school }: { schoolName: string; school: Record<string, string | null> }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  const [classRows, setClassRows] = useState([nextRowKey()]);
  const [subjectRows, setSubjectRows] = useState([nextRowKey()]);
  const [feeRows, setFeeRows] = useState([nextRowKey()]);
  const [termCount, setTermCount] = useState(3);

  const goNext = () => {
    const required: string[] = [];
    if (step === 0) {
      required.push("name");
    } else if (step === 1) {
      required.push("yearName", "yearStart", "yearEnd");
      for (let i = 0; i < termCount; i += 1) {
        required.push(`termName_${i}`, `termStart_${i}`, `termEnd_${i}`);
      }
    } else if (step === 2) {
      required.push(...classRows.map((k) => `className_${k}`));
    } else if (step === 3) {
      subjectRows.forEach((k) => required.push(`subjectCode_${k}`, `subjectName_${k}`));
    } else {
      feeRows.forEach((k) => required.push(`feeName_${k}`, `feeAmount_${k}`));
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
    setStep((s) => Math.max(0, s - 1));
  };

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

      <ActionForm
        action={completeSetup}
        className="rounded-2xl border bg-card p-6 sm:p-8"
        successLabel="School set up successfully"
        onSuccess={() => {
          router.push("/dashboard");
          router.refresh();
        }}
      >
        {/* Step 1: School details */}
        <section className={cn("space-y-4", step === 0 ? "" : "hidden")}>
          <div>
            <h2 className="text-lg font-semibold">Tell us about your school</h2>
            <p className="text-sm text-muted-foreground">
              These details will be shown across the platform and can be changed later in Settings.
            </p>
          </div>
          <TextInput name="name" label="School name" defaultValue={schoolName} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="motto" label="Motto" defaultValue={school.motto} />
            <TextInput name="registrationNumber" label="Registration number" defaultValue={school.registrationNumber} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="address" label="Address" defaultValue={school.address} />
            <TextInput name="phone" label="Phone" defaultValue={school.phone} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="email" label="Email" type="email" defaultValue={school.email} />
            <TextInput name="website" label="Website" defaultValue={school.website} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="currency" label="Currency code" defaultValue={school.currency} hint="e.g. MWK" />
            <TextInput name="currencySymbol" label="Currency symbol" defaultValue={school.currencySymbol} hint="e.g. MK" />
          </div>
          <TextInput name="logo" label="Logo URL" defaultValue={school.logo} hint="Optional. Leave empty to use the default." />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="primaryColor" label="Primary colour" type="color" defaultValue={school.primaryColor} />
            <TextInput name="secondaryColor" label="Secondary colour" type="color" defaultValue={school.secondaryColor} />
          </div>
        </section>

        {/* Step 2: Academic year & terms */}
        <section className={cn("space-y-4", step === 1 ? "" : "hidden")}>
          <div>
            <h2 className="text-lg font-semibold">Academic year & terms</h2>
            <p className="text-sm text-muted-foreground">The current academic year is set as active. You can add more later.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput name="yearName" label="Year name" placeholder="e.g. 2026" required />
            <TextInput name="yearStart" label="Start date" type="date" required />
            <TextInput name="yearEnd" label="End date" type="date" required />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Terms</h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant={termCount === n ? "default" : "ghost"}
                  onClick={() => setTermCount(n)}
                >
                  {n}
                </Button>
              ))}
              <span className="ml-1 text-xs text-muted-foreground">terms</span>
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: termCount }, (_, i) => (
              <div key={i} className="rounded-xl border p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextInput name={`termName_${i}`} label={`Term ${i + 1} name`} placeholder={`e.g. Term ${i + 1}`} required />
                  <TextInput name={`termStart_${i}`} label="Start date" type="date" required />
                  <TextInput name={`termEnd_${i}`} label="End date" type="date" required />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Step 3: Classes */}
        <section className={cn("space-y-4", step === 2 ? "" : "hidden")}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Classes</h2>
              <p className="text-sm text-muted-foreground">Add the classes your school offers.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setClassRows((r) => [...r, nextRowKey()])}>
              <PlusIcon className="size-4" /> Add class
            </Button>
          </div>
          <div className="space-y-4">
            {classRows.map((key, index) => (
              <div key={key} className="relative rounded-xl border p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextInput name={`className_${key}`} label={`Class ${index + 1} name`} placeholder="e.g. Standard 1" required />
                  <TextInput name={`classLevel_${key}`} label="Level" type="number" min={1} defaultValue={1} />
                  <TextInput name={`classCapacity_${key}`} label="Capacity" type="number" min={1} defaultValue={40} />
                </div>
                {classRows.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                    onClick={() => setClassRows((rows) => rows.filter((k) => k !== key))}
                    aria-label={`Remove class ${index + 1}`}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* Step 4: Subjects */}
        <section className={cn("space-y-4", step === 3 ? "" : "hidden")}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Subjects</h2>
              <p className="text-sm text-muted-foreground">Common subjects taught at your school.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setSubjectRows((r) => [...r, nextRowKey()])}>
              <PlusIcon className="size-4" /> Add subject
            </Button>
          </div>
          <div className="space-y-4">
            {subjectRows.map((key, index) => (
              <div key={key} className="relative rounded-xl border p-4">
                <div className="grid gap-4 sm:grid-cols-4">
                  <TextInput name={`subjectCode_${key}`} label={`Code ${index + 1}`} placeholder="e.g. ENG" required />
                  <TextInput name={`subjectName_${key}`} label="Name" placeholder="e.g. English" required />
                  <TextInput name={`subjectPassMark_${key}`} label="Pass mark" type="number" min={0} defaultValue={40} />
                  <TextInput name={`subjectMaxMark_${key}`} label="Max mark" type="number" min={1} defaultValue={100} />
                </div>
                {subjectRows.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                    onClick={() => setSubjectRows((rows) => rows.filter((k) => k !== key))}
                    aria-label={`Remove subject ${index + 1}`}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* Step 5: Fee structures */}
        <section className={cn("space-y-4", step === 4 ? "" : "hidden")}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Fee structures</h2>
              <p className="text-sm text-muted-foreground">Common fees. Assign to a class and term if applicable.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setFeeRows((r) => [...r, nextRowKey()])}>
              <PlusIcon className="size-4" /> Add fee
            </Button>
          </div>
          <div className="space-y-4">
            {feeRows.map((key, index) => (
              <div key={key} className="relative rounded-xl border p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <TextInput name={`feeName_${key}`} label={`Fee ${index + 1} name`} placeholder="e.g. Tuition" required />
                  <TextInput name={`feeCategory_${key}`} label="Category" placeholder="e.g. TUITION" defaultValue="TUITION" />
                  <TextInput name={`feeAmount_${key}`} label="Amount" type="number" min={0} step="0.01" required />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <NativeSelect
                    name={`feeClassIndex_${key}`}
                    label="Applies to class"
                    placeholder="All classes"
                    options={classRows.map((_, i) => ({ value: String(i), label: `Class ${i + 1}` }))}
                  />
                  <NativeSelect
                    name={`feeTermIndex_${key}`}
                    label="Applies to term"
                    placeholder="All terms"
                    options={Array.from({ length: termCount }, (_, i) => ({ value: String(i), label: `Term ${i + 1}` }))}
                  />
                </div>
                {feeRows.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                    onClick={() => setFeeRows((rows) => rows.filter((k) => k !== key))}
                    aria-label={`Remove fee ${index + 1}`}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {stepError ? (
          <p role="alert" className="mt-4 text-sm font-medium text-destructive">
            {stepError}
          </p>
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
            <SubmitButton pendingLabel="Setting up…" className="gap-2">
              Complete setup
            </SubmitButton>
          )}
        </div>
      </ActionForm>
    </div>
  );
}
