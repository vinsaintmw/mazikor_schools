export type FieldErrors = Record<string, string>;

export const VALID_PAYMENT_METHODS = ["CASH", "BANK", "MOBILE_MONEY", "CHEQUE", "OTHER"] as const;

export interface PaymentInput {
  invoiceId: string;
  amount: number;
  method: string;
  date: string;
  reference: string;
  balance: number;
}

export function paymentFieldErrors(input: PaymentInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.invoiceId) {
    errors.invoiceId = "Select an invoice";
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    errors.amount = "Enter an amount greater than zero";
  } else if (input.amount > input.balance + 0.005) {
    errors.amount = "Payment amount exceeds the balance due";
  }
  if (!input.method) {
    errors.method = "Select a payment method";
  } else if (!(VALID_PAYMENT_METHODS as readonly string[]).includes(input.method)) {
    errors.method = "Select a valid payment method";
  }
  if (input.date) {
    const parsed = new Date(`${input.date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) errors.date = "Enter a valid date";
  }
  if (input.reference.length > 100) {
    errors.reference = "Reference must be 100 characters or fewer";
  }
  return errors;
}

export interface MarkEntry {
  inputName: string;
  studentName: string;
  raw: string;
  maxMark: number;
}

export function marksFieldErrors(entries: MarkEntry[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const entry of entries) {
    if (!entry.raw.trim()) continue;
    const value = Number(entry.raw);
    if (!Number.isFinite(value)) {
      errors[entry.inputName] = `${entry.studentName}: enter a valid number`;
    } else if (value < 0) {
      errors[entry.inputName] = `${entry.studentName}: mark cannot be negative`;
    } else if (value > entry.maxMark) {
      errors[entry.inputName] = `${entry.studentName}: mark cannot exceed ${entry.maxMark}`;
    }
  }
  return errors;
}
