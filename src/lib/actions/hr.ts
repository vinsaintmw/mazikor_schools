"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { auditor } from "@/lib/audit";
import { assertPermission, enumOf, getSchoolId, toDate, toFloat, toInt, toStr } from "@/lib/server-helpers";
import { titleCase } from "@/lib/constants";

// ------------------------------------------------------------------
// Employees
// ------------------------------------------------------------------

export async function createEmployee(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "hr.manage");
  const schoolId = getSchoolId(session);

  const firstName = toStr(formData.get("firstName"));
  const lastName = toStr(formData.get("lastName"));
  const gender = toStr(formData.get("gender"));
  if (!firstName || !lastName || !gender) throw new Error("Name and gender are required");

  const employee = await db.employee.create({
    data: {
      schoolId,
      firstName: titleCase(firstName),
      lastName: titleCase(lastName),
      gender: enumOf(toStr(formData.get("gender")), ["MALE", "FEMALE"] as const, "MALE"),
      email: toStr(formData.get("email")) || null,
      phone: toStr(formData.get("phone")) || null,
      position: toStr(formData.get("position")) || null,
      departmentId: toStr(formData.get("departmentId")) || null,
      salary: toFloat(formData.get("salary"), 0),
      joiningDate: toDate(toStr(formData.get("joiningDate"))),
      status: enumOf(toStr(formData.get("status")), ["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"] as const, "ACTIVE"),
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "employee", entityId: employee.id });
  revalidatePath("/hr/employees");
}

export async function deleteEmployee(employeeId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "hr.manage");
  const schoolId = getSchoolId(session);
  const existing = await db.employee.findFirst({ where: { id: employeeId, schoolId } });
  if (!existing) throw new Error("Employee not found");
  await db.employee.delete({ where: { id: employeeId } });
  await auditor(session).log({ action: "DELETE", entity: "employee", entityId: employeeId });
  revalidatePath("/hr/employees");
}

// ------------------------------------------------------------------
// Leave
// ------------------------------------------------------------------

export async function createLeave(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "leave.manage");
  const schoolId = getSchoolId(session);

  const employeeId = toStr(formData.get("employeeId"));
  const type = toStr(formData.get("type"));
  const startDate = toDate(toStr(formData.get("startDate")));
  const endDate = toDate(toStr(formData.get("endDate")));
  if (!employeeId || !type || !startDate || !endDate) throw new Error("All fields are required");

  const days = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);

  const leave = await db.leave.create({
    data: {
      schoolId,
      employeeId,
      type: enumOf(toStr(formData.get("type")), ["ANNUAL", "SICK", "MATERNITY", "EMERGENCY", "OTHER"] as const, "ANNUAL"),
      startDate,
      endDate,
      days,
      reason: toStr(formData.get("reason")) || null,
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "leave", entityId: leave.id });
  revalidatePath("/hr/leave");
}

export async function updateLeaveStatus(leaveId: string, status: "APPROVED" | "REJECTED") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "leave.manage");
  const schoolId = getSchoolId(session);
  const existing = await db.leave.findFirst({ where: { id: leaveId, schoolId } });
  if (!existing) throw new Error("Leave request not found");

  await db.leave.update({
    where: { id: leaveId },
    data: {
      status,
      approvedById: session.user.id,
      approvedAt: new Date(),
    },
  });
  await auditor(session).log({ action: "UPDATE", entity: "leave", entityId: leaveId, details: { status } });
  revalidatePath("/hr/leave");
}

// ------------------------------------------------------------------
// Payroll
// ------------------------------------------------------------------

export async function createPayroll(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "payroll.manage");
  const schoolId = getSchoolId(session);

  const employeeId = toStr(formData.get("employeeId"));
  const periodStart = toDate(toStr(formData.get("periodStart")));
  const periodEnd = toDate(toStr(formData.get("periodEnd")));
  if (!employeeId || !periodStart || !periodEnd) throw new Error("Employee and period are required");

  const employee = await db.employee.findFirst({ where: { id: employeeId, schoolId } });
  if (!employee) throw new Error("Employee not found");

  const basicSalary = toFloat(formData.get("basicSalary"), Number(employee.salary ?? 0));
  const allowances = { housing: toFloat(formData.get("housingAllowance"), 0), transport: toFloat(formData.get("transportAllowance"), 0) };
  const deductions = { tax: toFloat(formData.get("tax"), 0), pension: toFloat(formData.get("pension"), 0) };

  const totalAllowances = allowances.housing + allowances.transport;
  const totalDeductions = deductions.tax + deductions.pension;
  const netSalary = Math.max(0, basicSalary + totalAllowances - totalDeductions);

  await db.payroll.create({
    data: {
      schoolId,
      employeeId,
      periodStart,
      periodEnd,
      basicSalary,
      allowances,
      deductions,
      netSalary,
      status: "DRAFT",
      processedById: session.user.id,
      notes: toStr(formData.get("notes")) || null,
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "payroll", entityId: employeeId });
  revalidatePath("/hr/payroll");
}

export async function updatePayrollStatus(payrollId: string, status: "PAID" | "CANCELLED") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "payroll.manage");
  const schoolId = getSchoolId(session);
  const existing = await db.payroll.findFirst({ where: { id: payrollId, schoolId } });
  if (!existing) throw new Error("Payroll not found");

  await db.payroll.update({
    where: { id: payrollId },
    data: { status, paidDate: status === "PAID" ? new Date() : null },
  });
  await auditor(session).log({ action: "UPDATE", entity: "payroll", entityId: payrollId, details: { status } });
  revalidatePath("/hr/payroll");
}
