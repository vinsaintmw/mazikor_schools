"use client";

import { useFieldError } from "@/components/form-field-error";

export function MarksInput({
  name,
  defaultValue,
  min,
  max,
  step,
  placeholder,
}: {
  name: string;
  defaultValue?: number | string;
  min: number;
  max: number;
  step: string;
  placeholder?: string;
}) {
  const fieldError = useFieldError(name);
  return (
    <div className="space-y-1">
      <input
        name={name}
        type="number"
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={fieldError ? true : undefined}
        className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8 sm:text-sm dark:bg-input/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
      />
      {fieldError ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {fieldError}
        </p>
      ) : null}
    </div>
  );
}
