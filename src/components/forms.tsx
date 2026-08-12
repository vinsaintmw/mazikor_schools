import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
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
    />
  );
  if (!label) return input;
  return (
    <Field label={label} htmlFor={inputId} required={required} hint={hint} className={className}>
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
  const select = (
    <select
      id={inputId}
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      onChange={onChange}
      className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
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
    <Field label={label} htmlFor={inputId} required={required} hint={hint} className={className}>
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
  return (
    <Field label={label} htmlFor={name} required={required} hint={hint} className={className}>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      />
    </Field>
  );
}
