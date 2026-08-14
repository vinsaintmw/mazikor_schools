import { test } from "node:test";
import assert from "node:assert/strict";
import { paymentFieldErrors, marksFieldErrors } from "../src/lib/validation";

test("paymentFieldErrors: valid payment has no errors", () => {
  const errors = paymentFieldErrors({
    invoiceId: "inv-1",
    amount: 50,
    method: "CASH",
    date: "2026-08-14",
    reference: "",
    balance: 100,
  });
  assert.deepEqual(errors, {});
});

test("paymentFieldErrors: amount must be greater than zero", () => {
  for (const amount of [0, -10, Number.NaN]) {
    const errors = paymentFieldErrors({ invoiceId: "inv-1", amount, method: "CASH", date: "", reference: "", balance: 100 });
    assert.match(errors.amount, /greater than zero/, `amount=${amount}`);
  }
});

test("paymentFieldErrors: amount cannot exceed balance due", () => {
  const errors = paymentFieldErrors({ invoiceId: "inv-1", amount: 150, method: "CASH", date: "", reference: "", balance: 100 });
  assert.equal(errors.amount, "Payment amount exceeds the balance due");
});

test("paymentFieldErrors: missing invoice", () => {
  const errors = paymentFieldErrors({ invoiceId: "", amount: 50, method: "CASH", date: "", reference: "", balance: 100 });
  assert.equal(errors.invoiceId, "Select an invoice");
});

test("paymentFieldErrors: missing or invalid method", () => {
  const missing = paymentFieldErrors({ invoiceId: "inv-1", amount: 50, method: "", date: "", reference: "", balance: 100 });
  assert.equal(missing.method, "Select a payment method");
  const invalid = paymentFieldErrors({ invoiceId: "inv-1", amount: 50, method: "BITCOIN", date: "", reference: "", balance: 100 });
  assert.equal(invalid.method, "Select a valid payment method");
});

test("paymentFieldErrors: invalid date", () => {
  const errors = paymentFieldErrors({ invoiceId: "inv-1", amount: 50, method: "CASH", date: "not-a-date", reference: "", balance: 100 });
  assert.equal(errors.date, "Enter a valid date");
});

test("paymentFieldErrors: oversized reference", () => {
  const errors = paymentFieldErrors({
    invoiceId: "inv-1",
    amount: 50,
    method: "CASH",
    date: "",
    reference: "x".repeat(101),
    balance: 100,
  });
  assert.equal(errors.reference, "Reference must be 100 characters or fewer");
});

test("marksFieldErrors: valid marks have no errors", () => {
  const errors = marksFieldErrors([
    { inputName: "mark_a", studentName: "Alice", raw: "75", maxMark: 100 },
    { inputName: "mark_b", studentName: "Bob", raw: "100", maxMark: 100 },
    { inputName: "mark_c", studentName: "Carol", raw: "", maxMark: 100 },
  ]);
  assert.deepEqual(errors, {});
});

test("marksFieldErrors: mark above maximum is rejected", () => {
  const errors = marksFieldErrors([{ inputName: "mark_a", studentName: "Alice", raw: "101", maxMark: 100 }]);
  assert.equal(errors.mark_a, "Alice: mark cannot exceed 100");
});

test("marksFieldErrors: negative mark is rejected", () => {
  const errors = marksFieldErrors([{ inputName: "mark_a", studentName: "Alice", raw: "-5", maxMark: 100 }]);
  assert.equal(errors.mark_a, "Alice: mark cannot be negative");
});

test("marksFieldErrors: non-numeric mark is rejected", () => {
  const errors = marksFieldErrors([{ inputName: "mark_a", studentName: "Alice", raw: "abc", maxMark: 100 }]);
  assert.equal(errors.mark_a, "Alice: enter a valid number");
});

test("marksFieldErrors: blank marks are skipped", () => {
  const errors = marksFieldErrors([
    { inputName: "mark_a", studentName: "Alice", raw: "   ", maxMark: 100 },
    { inputName: "mark_b", studentName: "Bob", raw: "", maxMark: 100 },
  ]);
  assert.deepEqual(errors, {});
});
