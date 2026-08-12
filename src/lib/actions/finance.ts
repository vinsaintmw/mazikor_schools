"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uid } from "@/lib/format";
import { auditor } from "@/lib/audit";
import { assertPermission, enumOf, getSchoolId, toBool, toDate, toFloat, toInt, toStr } from "@/lib/server-helpers";
import { createNotification } from "@/lib/notify";

// ------------------------------------------------------------------
// Fee structures
// ------------------------------------------------------------------

export async function createFeeStructure(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "fees.manage");
  const schoolId = getSchoolId(session);

  const name = toStr(formData.get("name"));
  const category = toStr(formData.get("category"));
  const amount = toFloat(formData.get("amount"));
  if (!name || !category || amount <= 0) throw new Error("Name, category and amount are required");

  const fee = await db.feeStructure.create({
    data: {
      schoolId,
      name,
      category,
      amount,
      classId: toStr(formData.get("classId")) || null,
      termId: toStr(formData.get("termId")) || null,
      isRequired: toBool(toStr(formData.get("isRequired"))),
      isActive: toBool(toStr(formData.get("isActive"))),
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "fee_structure", entityId: fee.id });
  revalidatePath("/fees");
}

export async function updateFeeStructure(feeId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "fees.manage");
  const schoolId = getSchoolId(session);
  const existing = await db.feeStructure.findFirst({ where: { id: feeId, schoolId } });
  if (!existing) throw new Error("Fee structure not found");

  await db.feeStructure.update({
    where: { id: feeId },
    data: {
      name: toStr(formData.get("name")) || existing.name,
      category: toStr(formData.get("category")) || existing.category,
      amount: toFloat(formData.get("amount"), Number(existing.amount)),
      classId: toStr(formData.get("classId")) || null,
      termId: toStr(formData.get("termId")) || null,
      isRequired: toBool(toStr(formData.get("isRequired"))),
      isActive: toBool(toStr(formData.get("isActive"))),
    },
  });
  await auditor(session).log({ action: "UPDATE", entity: "fee_structure", entityId: feeId });
  revalidatePath("/fees");
}

export async function deleteFeeStructure(feeId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "fees.manage");
  const schoolId = getSchoolId(session);
  const existing = await db.feeStructure.findFirst({ where: { id: feeId, schoolId } });
  if (!existing) throw new Error("Fee structure not found");
  await db.feeStructure.delete({ where: { id: feeId } });
  await auditor(session).log({ action: "DELETE", entity: "fee_structure", entityId: feeId });
  revalidatePath("/fees");
}

// ------------------------------------------------------------------
// Invoices
// ------------------------------------------------------------------

export async function createInvoice(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "invoices.create");
  const schoolId = getSchoolId(session);

  const studentId = toStr(formData.get("studentId"));
  const termId = toStr(formData.get("termId")) || null;
  const itemsRaw = toStr(formData.get("items"));
  if (!studentId || !itemsRaw) throw new Error("Student and invoice items are required");

  const student = await db.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) throw new Error("Student not found");

  const lines = itemsRaw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [description, amountStr] = l.split("|").map((p) => p.trim());
      const amount = parseFloat(amountStr ?? "");
      if (!description || !Number.isFinite(amount)) throw new Error(`Invalid item line: "${l}"`);
      return { description, amount };
    });

  const discount = toFloat(formData.get("discount"), 0);
  const dueDate = toDate(toStr(formData.get("dueDate")));
  const term = termId ? await db.term.findFirst({ where: { id: termId, schoolId } }) : null;

  const number = `INV-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;

  const invoice = await db.invoice.create({
    data: {
      schoolId,
      number,
      studentId,
      termId: term?.id ?? null,
      academicYearId: term?.academicYearId ?? null,
      dueDate,
      discount,
      notes: toStr(formData.get("notes")) || null,
      items: {
        create: lines.map((l) => ({ schoolId, description: l.description, amount: l.amount })),
      },
    },
    include: { student: true },
  });

  await auditor(session).log({
    action: "CREATE",
    entity: "invoice",
    entityId: invoice.id,
    details: { number, student: invoice.student.admissionNumber, lines: lines.length },
  });
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function deleteInvoice(invoiceId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const schoolId = getSchoolId(session);
  const existing = await db.invoice.findFirst({ where: { id: invoiceId, schoolId } });
  if (!existing) throw new Error("Invoice not found");
  await db.invoice.delete({ where: { id: invoiceId } });
  await auditor(session).log({ action: "DELETE", entity: "invoice", entityId: invoiceId });
  revalidatePath("/invoices");
}

// ------------------------------------------------------------------
// Payments
// ------------------------------------------------------------------

export async function recordPayment(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "payments.record");
  const schoolId = getSchoolId(session);

  const invoiceId = toStr(formData.get("invoiceId"));
  const amount = toFloat(formData.get("amount"));
  const method = toStr(formData.get("method"));
  if (!invoiceId || amount <= 0 || !method) throw new Error("Invoice, amount and method are required");

  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, schoolId },
    include: {
      items: true,
      payments: true,
      student: true,
    },
  });
  if (!invoice) throw new Error("Invoice not found");

  const total = invoice.items.reduce((sum, i) => sum + Number(i.amount), 0) - Number(invoice.discount);
  const paidSoFar = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;

  const payment = await db.payment.create({
    data: {
      schoolId,
      receiptNumber,
      invoiceId,
      studentId: invoice.studentId,
      amount,
      method: enumOf(toStr(formData.get("method")), ["CASH", "BANK", "MOBILE_MONEY", "CHEQUE", "OTHER"] as const, "CASH"),
      date: toDate(toStr(formData.get("date"))) ?? new Date(),
      reference: toStr(formData.get("reference")) || null,
      receivedById: session.user.id,
      notes: toStr(formData.get("notes")) || null,
    },
  });

  const newPaid = paidSoFar + amount;
  const status = newPaid >= total - 0.005 ? "PAID" : newPaid > 0 ? "PARTIALLY_PAID" : "UNPAID";
  await db.invoice.update({ where: { id: invoiceId }, data: { status } });

  await auditor(session).log({
    action: "CREATE",
    entity: "payment",
    entityId: payment.id,
    details: { receiptNumber, amount },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/payments");
  revalidatePath("/dashboard");
}

export async function deletePayment(paymentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const schoolId = getSchoolId(session);
  const payment = await db.payment.findFirst({ where: { id: paymentId, schoolId } });
  if (!payment) throw new Error("Payment not found");
  await db.payment.delete({ where: { id: paymentId } });
  await auditor(session).log({ action: "DELETE", entity: "payment", entityId: paymentId });
  revalidatePath("/payments");
  revalidatePath("/invoices");
}

// ------------------------------------------------------------------
// Expenses
// ------------------------------------------------------------------

export async function createExpense(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "expenses.manage");
  const schoolId = getSchoolId(session);

  const category = toStr(formData.get("category"));
  const description = toStr(formData.get("description"));
  const amount = toFloat(formData.get("amount"));
  if (!category || !description || amount <= 0) throw new Error("Category, description and amount are required");

  const expense = await db.expense.create({
    data: {
      schoolId,
      number: `EXP-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`,
      category: enumOf(toStr(formData.get("category")), ["SALARIES", "UTILITIES", "MAINTENANCE", "SUPPLIES", "TRANSPORT", "FOOD", "OTHER"] as const, "OTHER"),
      description,
      amount,
      date: toDate(toStr(formData.get("date"))) ?? new Date(),
      vendor: toStr(formData.get("vendor")) || null,
      method: enumOf(toStr(formData.get("method")), ["CASH", "BANK", "MOBILE_MONEY", "CHEQUE", "OTHER"] as const, "CASH"),
      notes: toStr(formData.get("notes")) || null,
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "expense", entityId: expense.id });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteExpense(expenseId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const schoolId = getSchoolId(session);
  const existing = await db.expense.findFirst({ where: { id: expenseId, schoolId } });
  if (!existing) throw new Error("Expense not found");
  await db.expense.delete({ where: { id: expenseId } });
  await auditor(session).log({ action: "DELETE", entity: "expense", entityId: expenseId });
  revalidatePath("/expenses");
}
