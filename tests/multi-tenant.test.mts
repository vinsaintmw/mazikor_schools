import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import type { ComponentType } from "react";
import { db } from "../src/lib/db";
import { ROLE_PERMISSIONS } from "../src/lib/constants";
import { createTenant, deleteTenant, installMocks, makeSession, setSession, type Tenant } from "./helpers/tenant";

type ActionResult = { ok: boolean; error?: string } | undefined;

function expectOk(result: ActionResult): asserts result is { ok: true } | undefined {
  if (result && typeof result === "object" && "ok" in result) {
    assert.equal(result.ok, true, `expected action to succeed, got: ${JSON.stringify(result)}`);
  }
}

function expectFail(result: ActionResult, pattern?: RegExp): void {
  assert.ok(result && typeof result === "object" && "ok" in result, `expected failure, got: ${String(result)}`);
  const r = result as { ok: boolean; error?: string };
  assert.equal(r.ok, false, `expected failure, got: ${JSON.stringify(result)}`);
  if (pattern) assert.match(r.error ?? "", pattern);
}

// ---------------------------------------------------------------------------
// Form builders (mirror the real UI payloads)
// ---------------------------------------------------------------------------

function studentForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("firstName", "Create");
  fd.set("lastName", "Student");
  fd.set("middleName", "");
  fd.set("gender", "FEMALE");
  fd.set("dateOfBirth", "2010-05-05");
  fd.set("nationality", "Malawian");
  fd.set("admissionNumber", `STU-CAN-${Date.now()}`);
  fd.set("admissionDate", "2026-01-10");
  fd.set("streamId", "");
  fd.set("phone", "");
  fd.set("email", "");
  fd.set("house", "");
  fd.set("previousSchool", "");
  fd.set("status", "ACTIVE");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

function teacherForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("firstName", "Create");
  fd.set("lastName", "Teacher");
  fd.set("gender", "MALE");
  fd.set("dateOfBirth", "");
  fd.set("phone", "");
  fd.set("email", "");
  fd.set("address", "");
  fd.set("qualification", "");
  fd.set("specialization", "");
  fd.set("joiningDate", "");
  fd.set("employmentType", "FULL_TIME");
  fd.set("salary", "");
  fd.set("status", "ACTIVE");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

function parentForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("firstName", "Create");
  fd.set("lastName", "Parent");
  fd.set("phone", "+265123456789");
  fd.set("email", "");
  fd.set("address", "");
  fd.set("occupation", "");
  fd.set("relationship", "Father");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let A: Tenant;
let B: Tenant;
let people: typeof import("../src/lib/actions/people");
let academics: typeof import("../src/lib/actions/academics");
let finance: typeof import("../src/lib/actions/finance");
let school: typeof import("../src/lib/actions/school");
let searchRoute: typeof import("../src/app/api/search/route");
let notificationsRoute: typeof import("../src/app/api/notifications/route");
let StudentDetailPage: typeof import("../src/app/(app)/students/[id]/page").default;

before(async () => {
  installMocks();
  A = await createTenant("Alpha");
  B = await createTenant("Beta");
  setSession(makeSession(A, ROLE_PERMISSIONS.school_admin));
  people = await import("../src/lib/actions/people");
  academics = await import("../src/lib/actions/academics");
  finance = await import("../src/lib/actions/finance");
  school = await import("../src/lib/actions/school");
  searchRoute = await import("../src/app/api/search/route");
  notificationsRoute = await import("../src/app/api/notifications/route");
  StudentDetailPage = (await import("../src/app/(app)/students/[id]/page")).default;
});

after(async () => {
  setSession(null);
  await deleteTenant([A, B]);
  await db.$disconnect();
});

// ---------------------------------------------------------------------------
// Server actions: School A admin can manage School A records
// ---------------------------------------------------------------------------

describe("School A admin CAN manage own records", () => {
  test("creates and edits own student", async () => {
    const created = await people.createStudent(studentForm());
    expectOk(created);
    const r = created as { ok: true; data: { id: string; schoolId: string } };
    assert.equal(r.data.schoolId, A.schoolId);
    expectOk(await people.updateStudent(r.data.id, studentForm({ firstName: "Edited" })));
    const reloaded = await db.student.findFirst({ where: { id: r.data.id } });
    assert.equal(reloaded?.firstName, "Edited");
    expectOk(await people.deleteStudent(r.data.id));
  });

  test("creates own teacher", async () => {
    const created = await people.createTeacher(teacherForm());
    expectOk(created);
    const r = created as { ok: true; data: { id: string; schoolId: string } };
    assert.equal(r.data.schoolId, A.schoolId);
  });

  test("creates own parent", async () => {
    const created = await people.createParent(parentForm());
    expectOk(created);
    const r = created as { ok: true; data: { id: string; schoolId: string } };
    assert.equal(r.data.schoolId, A.schoolId);
  });

  test("creates own class, stream subject scope", async () => {
    expectOk(await academics.createClass(form({ name: "Standard 2", level: "2", capacity: "40" })));
    expectOk(await academics.createSubject(form({ code: `PHY-${Date.now()}`, name: "Physics", passMark: "40", maxMark: "100" })));
    const cls = await db.class.findFirst({ where: { schoolId: A.schoolId, name: "Standard 2" } });
    assert.ok(cls);
    expectOk(await academics.createStream(form({ classId: cls.id, name: "B" })));
  });

  test("records attendance for own stream", async () => {
    const fd = form({ date: "2026-02-10", streamId: A.streamId });
    fd.set(`status_${A.studentId}`, "PRESENT");
    expectOk(await academics.saveAttendance(fd));
    const rows = await db.attendance.findMany({ where: { schoolId: A.schoolId, streamId: A.streamId, date: new Date("2026-02-10T00:00:00") } });
    assert.equal(rows.length, 1);
  });

  test("creates own exam, fee, invoice, payment, expense, notice, event", async () => {
    expectOk(await academics.createExam(form({ name: "End of Term", termId: A.termId, type: "END_OF_TERM" })));
    expectOk(await finance.createFeeStructure(form({ name: "Sports", category: "SPORTS", amount: "200" })));
    expectOk(await finance.createInvoice(form({ studentId: A.studentId, termId: A.termId, items: "Tuition|500", discount: "0" })));
    expectOk(await finance.createExpense(form({ category: "SUPPLIES", description: "Chalk", amount: "50" })));
    expectOk(await school.createNotice(form({ title: "Holiday", content: "School closed", audience: "EVERYONE" })));
    expectOk(await school.createEvent(form({ title: "Sports Day", startDate: "2026-06-01" })));
  });

  test("records a payment against own invoice", async () => {
    const fd = form({ invoiceId: A.invoiceId, amount: "300", method: "CASH", date: "2026-08-01", reference: "" });
    expectOk(await finance.recordPayment(fd));
  });

  test("enters marks for own exam subject", async () => {
    const fd = form({});
    fd.set(`mark_${A.studentId}`, "80");
    expectOk(await academics.saveMarks(A.examSubjectId, fd));
    const r = await db.result.findFirst({ where: { examSubjectId: A.examSubjectId, studentId: A.studentId } });
    assert.ok(r);
    assert.equal(Number(r.percentage), 80);
  });
});

// ---------------------------------------------------------------------------
// Server actions: cross-tenant access is rejected
// ---------------------------------------------------------------------------

describe("School A admin CANNOT touch School B records", () => {
  test("students", async () => {
    expectFail(await people.updateStudent(B.studentId, studentForm()), /Student not found/);
    expectFail(await people.deleteStudent(B.studentId), /Student not found/);
    expectFail(await people.linkParent(B.studentId, form({ parentId: A.parentId })), /Student not found/);
    expectFail(await people.linkParent(A.studentId, form({ parentId: B.parentId })), /Parent not found/);
    expectFail(await people.addStudentNote(form({ studentId: B.studentId, title: "Sneak", body: "x" })), /Student not found/);
  });

  test("teachers", async () => {
    expectFail(await people.updateTeacher(B.teacherId, teacherForm()), /Teacher not found/);
    expectFail(await people.deleteTeacher(B.teacherId), /Teacher not found/);
  });

  test("parents", async () => {
    expectFail(await people.updateParent(B.parentId, parentForm()), /Parent not found/);
    expectFail(await people.deleteParent(B.parentId), /Parent not found/);
  });

  test("classes, streams and subjects", async () => {
    expectFail(await academics.updateClass(B.classId, form({ name: "Hijack" })), /Class not found/);
    expectFail(await academics.deleteClass(B.classId), /Class not found/);
    expectFail(await academics.createStream(form({ classId: B.classId, name: "X" })), /Class not found/);
    expectFail(await academics.deleteStream(B.streamId), /Stream not found/);
    expectFail(await academics.toggleClassSubject(B.classId, form({ subjectId: A.subjectId })), /Class not found/);
    expectFail(await academics.toggleClassSubject(A.classId, form({ subjectId: B.subjectId })), /Subject not found/);
    expectFail(await academics.assignSubjectTeacher(form({ teacherId: B.teacherId, subjectId: A.subjectId, classId: A.classId })), /Teacher not found/);
    expectFail(await academics.unassignSubjectTeacher(B.subjectTeacherId), /Assignment not found/);
    expectFail(await academics.updateSubject(B.subjectId, form({ code: "XXX", name: "Nope" })), /Subject not found/);
    expectFail(await academics.deleteSubject(B.subjectId), /Subject not found/);
  });

  test("attendance", async () => {
    expectFail(await academics.saveAttendance(form({ date: "2026-02-10", streamId: B.streamId })), /Stream not found/);
  });

  test("exams and results", async () => {
    expectFail(await academics.createExam(form({ name: "Sneak", termId: B.termId })), /Term not found/);
    expectFail(await academics.updateExam(B.examId, form({ name: "Hijack" })), /Exam not found/);
    expectFail(await academics.deleteExam(B.examId), /Exam not found/);
    expectFail(await academics.publishExam(B.examId, true), /Exam not found/);
    const marks = form({});
    marks.set(`mark_${B.studentId}`, "90");
    expectFail(await academics.saveMarks(B.examSubjectId, marks), /Exam subject not found/);
  });

  test("fees, invoices, payments, expenses", async () => {
    expectFail(await finance.updateFeeStructure(B.feeId, form({ name: "Hijack" })), /Fee structure not found/);
    expectFail(await finance.deleteFeeStructure(B.feeId), /Fee structure not found/);
    expectFail(await finance.createInvoice(form({ studentId: B.studentId, termId: B.termId, items: "Tuition|500" })), /Student not found/);
    expectFail(await finance.deleteInvoice(B.invoiceId), /Invoice not found/);
    expectFail(await finance.recordPayment(form({ invoiceId: B.invoiceId, amount: "50", method: "CASH", date: "2026-08-01" })), /Invoice not found/);
    expectFail(await finance.deletePayment(B.paymentId), /Payment not found/);
    expectFail(await finance.deleteExpense(B.expenseId), /Expense not found/);
  });

  test("notices and events", async () => {
    expectFail(await school.updateNotice(B.noticeId, form({ title: "Hijack", content: "x" })), /Notice not found/);
    expectFail(await school.deleteNotice(B.noticeId), /Notice not found/);
    expectFail(await school.deleteEvent(B.eventId), /Event not found/);
  });

  test("cross-tenant writes leave School B data untouched", async () => {
    const beforeB = await db.$transaction([
      db.student.findUnique({ where: { id: B.studentId }, select: { lastName: true } }),
      db.invoice.findUnique({ where: { id: B.invoiceId }, select: { status: true } }),
      db.exam.findUnique({ where: { id: B.examId }, select: { isPublished: true } }),
      db.payment.count({ where: { schoolId: B.schoolId } }),
    ]);
    assert.equal(beforeB[0]?.lastName, `StudentBeta`);
    assert.equal(beforeB[1]?.status, "UNPAID");
    assert.equal(beforeB[2]?.isPublished, false);
    const paymentCount = beforeB[3];

    setSession(null);
    const unauthStudent = await people.updateStudent(B.studentId, studentForm());
    assert.equal(unauthStudent?.ok, false);
    assert.equal(unauthStudent?.error, "Unauthorized");
    setSession(makeSession(A, ROLE_PERMISSIONS.school_admin));

    const afterB = await db.$transaction([
      db.student.findUnique({ where: { id: B.studentId }, select: { lastName: true } }),
      db.invoice.findUnique({ where: { id: B.invoiceId }, select: { status: true } }),
      db.exam.findUnique({ where: { id: B.examId }, select: { isPublished: true } }),
      db.payment.count({ where: { schoolId: B.schoolId } }),
    ]);
    assert.deepEqual(afterB, beforeB);
    assert.equal(afterB[3], paymentCount);
  });
});

// ---------------------------------------------------------------------------
// Permission gating
// ---------------------------------------------------------------------------

describe("permission gating", () => {
  test("missing permission throws PermissionError", async () => {
    const noEdit = makeSession(A, ROLE_PERMISSIONS.parent ?? []);
    setSession(noEdit);
    await assert.rejects(() => people.updateStudent(A.studentId, studentForm()), (e: unknown) => {
      assert.equal((e as Error).name, "PermissionError");
      return true;
    });
    await assert.rejects(() => people.createStudent(studentForm()), (e: unknown) => {
      assert.equal((e as Error).name, "PermissionError");
      return true;
    });
    setSession(makeSession(A, ROLE_PERMISSIONS.school_admin));
  });
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

describe("API route isolation", () => {
  test("/api/search rejects unauthenticated requests", async () => {
    setSession(null);
    const res = await searchRoute.GET(new Request("http://localhost/api/search?q=StudentBeta"));
    assert.equal(res.status, 401);
  });

  test("/api/search only returns School A matches for School A admin", async () => {
    setSession(makeSession(A, ROLE_PERMISSIONS.school_admin));
    const own = await searchRoute.GET(new Request(`http://localhost/api/search?q=StudentAlpha`));
    const ownBody = (await own.json()) as { results: { id: string; type: string }[] };
    assert.ok(ownBody.results.some((r) => r.id === A.studentId));

    const cross = await searchRoute.GET(new Request(`http://localhost/api/search?q=StudentBeta`));
    const crossBody = (await cross.json()) as { results: { id: string; type: string }[] };
    assert.ok(!crossBody.results.some((r) => r.id === B.studentId));

    const byAdmission = await searchRoute.GET(new Request(`http://localhost/api/search?q=STU-${B.label.toLowerCase()}`));
    const admissionBody = (await byAdmission.json()) as { results: { id: string }[] };
    assert.equal(admissionBody.results.length, 0);
  });

  test("/api/notifications only exposes the current user's notifications", async () => {
    setSession(makeSession(A, ROLE_PERMISSIONS.school_admin));
    const res = await notificationsRoute.GET();
    const body = (await res.json()) as { items: { title: string; readAt: string | null }[] };
    assert.ok(body.items.some((n) => n.title === "Notif Alpha"));
    assert.ok(!body.items.some((n) => n.title === "Notif Beta"));

    await notificationsRoute.POST();
    const a = await db.notification.findUnique({ where: { id: A.notificationId } });
    const b = await db.notification.findUnique({ where: { id: B.notificationId } });
    assert.ok(a?.readAt, "own notification marked read");
    assert.equal(b?.readAt, null, "other tenant's notification untouched");
  });
});

// ---------------------------------------------------------------------------
// URL / ID manipulation (page-level 404 semantics)
// ---------------------------------------------------------------------------

describe("URL manipulation is rejected (404 semantics)", () => {
  test("every School B record is invisible to a school-scoped lookup from School A", async () => {
    const lookups: [string, unknown][] = [
      ["academicYear", B.academicYearId],
      ["term", B.termId],
      ["class", B.classId],
      ["stream", B.streamId],
      ["subject", B.subjectId],
      ["teacher", B.teacherId],
      ["parent", B.parentId],
      ["student", B.studentId],
      ["feeStructure", B.feeId],
      ["invoice", B.invoiceId],
      ["payment", B.paymentId],
      ["expense", B.expenseId],
      ["exam", B.examId],
      ["examSubject", B.examSubjectId],
      ["subjectTeacher", B.subjectTeacherId],
      ["notice", B.noticeId],
      ["event", B.eventId],
      ["document", B.documentId],
      ["notification", B.notificationId],
    ] as const;

    type ScopedFindFirst = (args: { where: Record<string, unknown> }) => Promise<unknown>;
    const modelTable = db as unknown as Record<string, { findFirst: ScopedFindFirst }>;

    for (const [model, foreignId] of lookups) {
      const byForeign = await modelTable[model].findFirst({ where: { id: foreignId, schoolId: B.schoolId } });
      assert.ok(byForeign, `${model} fixture should exist for School B`);
      const byCrossSchool = await modelTable[model].findFirst({ where: { id: foreignId, schoolId: A.schoolId } });
      assert.equal(byCrossSchool, null, `School A lookup leaked School B ${model}`);
    }
  });

  test("student detail page renders own student", async () => {
    setSession(makeSession(A, ROLE_PERMISSIONS.school_admin));
    const html = await renderPage(asPage(StudentDetailPage), { id: A.studentId }, {});
    assert.match(html, new RegExp(`STU-${A.label.toLowerCase()}`));
  });

  test("student detail page 404s for another school's student id", async () => {
    setSession(makeSession(A, ROLE_PERMISSIONS.school_admin));
    const digest = await captureRender(asPage(StudentDetailPage), { id: B.studentId }, {});
    assert.match(digest, /NEXT_HTTP_ERROR_FALLBACK;404/);
  });

  test("student detail page 404s for unknown ids", async () => {
    setSession(makeSession(A, ROLE_PERMISSIONS.school_admin));
    const digest = await captureRender(asPage(StudentDetailPage), { id: "cm-unknown-id-00000000000" }, {});
    assert.match(digest, /NEXT_HTTP_ERROR_FALLBACK;404/);
  });
});

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, unknown>> };
type AnyPage = (props: PageProps) => unknown;

function asPage(page: unknown): AnyPage {
  return page as AnyPage;
}

async function renderPage(
  Page: AnyPage,
  params: { id: string },
  searchParams: Record<string, unknown>
): Promise<string> {
  const React = await import("react");
  const { renderToReadableStream } = await import("react-dom/server");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const mockRouter = {
    push: () => {},
    replace: () => {},
    refresh: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    bfcacheId: "test",
    pathname: "/",
    params: {},
    query: {},
  };
  const element = React.createElement(
    AppRouterContext.Provider,
    { value: mockRouter },
    React.createElement(Page as ComponentType<PageProps>, { params: Promise.resolve(params), searchParams: Promise.resolve(searchParams) })
  );
  const stream = await renderToReadableStream(element);
  return new Response(stream).text();
}

async function captureRender(
  Page: AnyPage,
  params: { id: string },
  searchParams: Record<string, unknown>
): Promise<string> {
  try {
    await renderPage(Page, params, searchParams);
    return "NO-ERROR";
  } catch (e) {
    return (e as Error & { digest?: string }).digest ?? (e as Error).message;
  }
}

// ---------------------------------------------------------------------------
// Small helper
// ---------------------------------------------------------------------------

function form(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}
