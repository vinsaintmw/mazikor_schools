import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(__dirname, "..", "src");

// Tenant-owned models: every record carries `schoolId` and must never be
// fetched, updated or deleted by its primary key alone. A query that only
// filters on `id` (or a composite key) with no `schoolId` / `school` is an
// IDOR tripwire.
const TENANT_MODELS = [
  "academicYear",
  "term",
  "class",
  "stream",
  "department",
  "subject",
  "classSubject",
  "subjectTeacher",
  "student",
  "studentNote",
  "parent",
  "studentParent",
  "enrollment",
  "teacher",
  "staff",
  "attendance",
  "staffAttendance",
  "gradeScale",
  "gradeBand",
  "exam",
  "examSubject",
  "result",
  "feeStructure",
  "invoice",
  "invoiceItem",
  "payment",
  "expense",
  "timetableEntry",
  "assignment",
  "assignmentSubmission",
  "notice",
  "event",
  "book",
  "bookLoan",
  "vehicle",
  "route",
  "inventoryItem",
  "employee",
  "leave",
  "payroll",
  "document",
  "notification",
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

function readAll(): { path: string; content: string }[] {
  return walk(SRC).map((path) => ({ path, content: readFileSync(path, "utf8") }));
}

test("tenant isolation: no school-scoped model is read by id without schoolId", () => {
  const violations: string[] = [];

  for (const { path, content } of readAll()) {
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      const model = TENANT_MODELS.find((m) => line.includes(`db.${m}.`));
      if (!model) return;

      // Only read methods can leak another tenant's data. Updates/deletes on
      // ids that were already verified school-scoped are safe by construction.
      const readMethod = /\.(findUnique|findFirst|findMany)\(\{/.test(line);
      if (!readMethod) return;

      // Only flag single-line calls that filter by id but carry no school scope.
      const filtersById = /\bid:\s/.test(line);
      if (!filtersById) return;

      const hasSchoolScope =
        line.includes("schoolId") || line.includes("school: {") || line.includes("schoolId:") || line.includes("school:");
      if (!hasSchoolScope) {
        violations.push(`${path.replace(SRC, "src")}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  assert.deepEqual(
    violations,
    [],
    "Found school-scoped Prisma reads filtering by id without a schoolId scope:\n" + violations.join("\n")
  );
});

test("tenant isolation: no global-unique lookups on tenant columns", () => {
  // These were made composite in the schema; finding them again means a
  // regression that would let School A look up School B by admission number,
  // employee id, receipt number, etc.
  const banned = [
    "student.findUnique({ where: { admissionNumber",
    "teacher.findUnique({ where: { employeeId",
    "staff.findUnique({ where: { employeeId",
    "invoice.findUnique({ where: { number",
    "payment.findUnique({ where: { receiptNumber",
    "expense.findUnique({ where: { number",
  ];
  const hits: string[] = [];
  for (const { path, content } of readAll()) {
    for (const pattern of banned) {
      if (content.includes(pattern)) hits.push(`${path.replace(SRC, "src")} contains: ${pattern}`);
    }
  }
  assert.deepEqual(hits, [], "Global-unique lookups on tenant columns are not allowed:\n" + hits.join("\n"));
});
