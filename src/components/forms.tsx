"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useFieldError } from "@/components/form-field-error";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  name,
  label,
  defaultValue,
  type = "text",
  required,
  placeholder,
  hint,
  step,
  min,
  max,
  className,
  id,
}: {
  name: string;
  label?: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  step?: string | number;
  min?: number;
  max?: number;
  className?: string;
  id?: string;
}) {
  const inputId = id ?? name;
  const fieldError = useFieldError(name);
  const input = (
    <Input
      id={inputId}
      name={name}
      type={type}
      defaultValue={defaultValue == null ? "" : defaultValue}
      required={required}
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
      aria-invalid={fieldError ? true : undefined}
    />
  );
  if (!label) return input;
  return (
    <Field label={label} htmlFor={inputId} required={required} hint={hint} error={fieldError} className={className}>
      {input}
    </Field>
  );
}

export function NativeSelect({
  name,
  label,
  defaultValue,
  options,
  required,
  placeholder,
  hint,
  className,
  id,
  onChange,
}: {
  name: string;
  label?: string;
  defaultValue?: string | null;
  options: readonly (string | { value: string; label: string })[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  className?: string;
  id?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  const inputId = id ?? name;
  const fieldError = useFieldError(name);
  const select = (
    <select
      id={inputId}
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      onChange={onChange}
      aria-invalid={fieldError ? true : undefined}
      className="h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:text-sm dark:bg-input/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((opt) => {
        const value = typeof opt === "string" ? opt : opt.value;
        const text = typeof opt === "string" ? opt.replace(/_/g, " ") : opt.label;
        return (
          <option key={value} value={value}>
            {text}
          </option>
        );
      })}
    </select>
  );
  if (!label) return select;
  return (
    <Field label={label} htmlFor={inputId} required={required} hint={hint} error={fieldError} className={className}>
      {select}
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  defaultValue,
  required,
  placeholder,
  rows = 3,
  hint,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  hint?: string;
  className?: string;
}) {
  const fieldError = useFieldError(name);
  return (
    <Field label={label} htmlFor={name} required={required} hint={hint} error={fieldError} className={className}>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={fieldError ? true : undefined}
        className="w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
      />
    </Field>
  );
}
