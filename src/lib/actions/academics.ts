"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uid } from "@/lib/format";
import { auditor } from "@/lib/audit";
import { assertPermission, enumOf, getSchoolId, toBool, toDate, toFloat, toInt, toStr } from "@/lib/server-helpers";
import { titleCase } from "@/lib/constants";
import { endOfDay, startOfDay, fullName } from "@/lib/format";
import { error } from "@/lib/action-result";
import { requireAnyPermission } from "@/lib/permissions";
import { marksFieldErrors } from "@/lib/validation";

// ------------------------------------------------------------------
// Classes
// ------------------------------------------------------------------

export async function createClass(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "classes.create");
  const schoolId = getSchoolId(session);

  const name = toStr(formData.get("name"));
  if (!name) return error("Class name is required");

  const existing = await db.class.findFirst({ where: { schoolId, name } });
  if (existing) return error("A class with this name already exists");

  const cls = await db.class.create({
    data: {
      schoolId,
      name,
      level: toInt(formData.get("level"), 1),
      capacity: toInt(formData.get("capacity"), 40),
      room: toStr(formData.get("room")) || null,
      classTeacherId: toStr(formData.get("classTeacherId")) || null,
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "class", entityId: cls.id });
  revalidatePath("/classes");
}

export async function updateClass(classId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "classes.edit");
  const schoolId = getSchoolId(session);

  const existing = await db.class.findFirst({ where: { id: classId, schoolId } });
  if (!existing) return error("Class not found");

  await db.class.update({
    where: { id: classId },
    data: {
      name: toStr(formData.get("name")) || existing.name,
      level: toInt(formData.get("level"), existing.level),
      capacity: toInt(formData.get("capacity"), existing.capacity),
      room: toStr(formData.get("room")) || null,
      classTeacherId: toStr(formData.get("classTeacherId")) || null,
    },
  });
  await auditor(session).log({ action: "UPDATE", entity: "class", entityId: classId });
  revalidatePath("/classes");
  revalidatePath(`/classes/${classId}`);
}

export async function deleteClass(classId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "classes.delete");
  const schoolId = getSchoolId(session);
  const existing = await db.class.findFirst({ where: { id: classId, schoolId } });
  if (!existing) return error("Class not found");
  await db.class.delete({ where: { id: classId } });
  await auditor(session).log({ action: "DELETE", entity: "class", entityId: classId });
  revalidatePath("/classes");
}

export async function createStream(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "classes.edit");
  const schoolId = getSchoolId(session);
  const classId = toStr(formData.get("classId"));
  const name = toStr(formData.get("name"));
  if (!classId || !name) return error("Stream name and class are required");

  const cls = await db.class.findFirst({ where: { id: classId, schoolId } });
  if (!cls) return error("Class not found");

  await db.stream.create({ data: { schoolId, classId, name } });
  revalidatePath(`/classes/${classId}`);
}

export async function deleteStream(streamId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "classes.edit");
  const schoolId = getSchoolId(session);
  const stream = await db.stream.findFirst({ where: { id: streamId, schoolId } });
  if (!stream) return error("Stream not found");
  await db.stream.delete({ where: { id: streamId } });
  revalidatePath(`/classes/${stream.classId}`);
}

export async function toggleClassSubject(classId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "classes.edit");
  const schoolId = getSchoolId(session);
  const subjectId = toStr(formData.get("subjectId"));
  if (!subjectId) return error("Subject is required");

  const cls = await db.class.findFirst({ where: { id: classId, schoolId } });
  if (!cls) return error("Class not found");
  const subject = await db.subject.findFirst({ where: { id: subjectId, schoolId } });
  if (!subject) return error("Subject not found");

  const existing = await db.classSubject.findUnique({
    where: { classId_subjectId: { classId, subjectId } },
  });
  if (existing) {
    await db.classSubject.delete({ where: { id: existing.id } });
  } else {
    await db.classSubject.create({ data: { schoolId, classId, subjectId } });
  }
  revalidatePath(`/classes/${classId}`);
}

export async function assignSubjectTeacher(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "classes.edit");
  const schoolId = getSchoolId(session);
  const teacherId = toStr(formData.get("teacherId"));
  const subjectId = toStr(formData.get("subjectId"));
  const classId = toStr(formData.get("classId"));
  if (!teacherId || !subjectId || !classId) return error("All fields are required");

  const teacher = await db.teacher.findFirst({ where: { id: teacherId, schoolId } });
  if (!teacher) return error("Teacher not found");
  const subject = await db.subject.findFirst({ where: { id: subjectId, schoolId } });
  if (!subject) return error("Subject not found");
  const cls = await db.class.findFirst({ where: { id: classId, schoolId } });
  if (!cls) return error("Class not found");

  await db.subjectTeacher.upsert({
    where: { teacherId_subjectId_classId: { teacherId, subjectId, classId } },
    create: { schoolId, teacherId, subjectId, classId },
    update: {},
  });
  revalidatePath(`/classes/${classId}`);
}

export async function unassignSubjectTeacher(assignmentId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "classes.edit");
  const schoolId = getSchoolId(session);
  const link = await db.subjectTeacher.findFirst({ where: { id: assignmentId, schoolId } });
  if (!link) return error("Assignment not found");
  await db.subjectTeacher.delete({ where: { id: assignmentId } });
  revalidatePath(`/classes/${link.classId}`);
}

// ------------------------------------------------------------------
// Subjects
// ------------------------------------------------------------------

export async function createSubject(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "subjects.create");
  const schoolId = getSchoolId(session);

  const code = toStr(formData.get("code")).toUpperCase();
  const name = titleCase(toStr(formData.get("name")));
  if (!code || !name) return error("Subject code and name are required");

  const existing = await db.subject.findFirst({ where: { schoolId, code } });
  if (existing) return error("A subject with this code already exists");

  const departmentId = toStr(formData.get("departmentId")) || null;
  if (departmentId) {
    const department = await db.department.findFirst({ where: { id: departmentId, schoolId } });
    if (!department) return error("Invalid department");
  }

  const subject = await db.subject.create({
    data: {
      schoolId,
      code,
      name,
      description: toStr(formData.get("description")) || null,
      departmentId,
      passMark: toFloat(formData.get("passMark"), 40),
      maxMark: toFloat(formData.get("maxMark"), 100),
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "subject", entityId: subject.id });
  revalidatePath("/subjects");
}

export async function updateSubject(subjectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "subjects.edit");
  const schoolId = getSchoolId(session);
  const existing = await db.subject.findFirst({ where: { id: subjectId, schoolId } });
  if (!existing) return error("Subject not found");

  const departmentId = toStr(formData.get("departmentId")) || null;
  if (departmentId) {
    const department = await db.department.findFirst({ where: { id: departmentId, schoolId } });
    if (!department) return error("Invalid department");
  }

  await db.subject.update({
    where: { id: subjectId },
    data: {
      code: toStr(formData.get("code")).toUpperCase() || existing.code,
      name: titleCase(toStr(formData.get("name"))) || existing.name,
      description: toStr(formData.get("description")) || null,
      departmentId,
      passMark: toFloat(formData.get("passMark"), Number(existing.passMark)),
      maxMark: toFloat(formData.get("maxMark"), Number(existing.maxMark)),
    },
  });
  await auditor(session).log({ action: "UPDATE", entity: "subject", entityId: subjectId });
  revalidatePath("/subjects");
}

export async function deleteSubject(subjectId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "subjects.delete");
  const schoolId = getSchoolId(session);
  const existing = await db.subject.findFirst({ where: { id: subjectId, schoolId } });
  if (!existing) return error("Subject not found");
  await db.subject.delete({ where: { id: subjectId } });
  await auditor(session).log({ action: "DELETE", entity: "subject", entityId: subjectId });
  revalidatePath("/subjects");
}

// ------------------------------------------------------------------
// Attendance
// ------------------------------------------------------------------

export async function saveAttendance(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "attendance.manage");
  const schoolId = getSchoolId(session);

  const dateStr = toStr(formData.get("date"));
  const streamId = toStr(formData.get("streamId"));
  const subjectId = toStr(formData.get("subjectId")) || null;
  if (!dateStr || !streamId) return error("Date and class stream are required");

  const stream = await db.stream.findFirst({ where: { id: streamId, schoolId } });
  if (!stream) return error("Stream not found");
  const day = new Date(`${dateStr}T00:00:00`);

  const entries = await db.attendance.findMany({
    where: { schoolId, streamId, subjectId, date: { gte: startOfDay(day), lte: endOfDay(day) } },
  });
  const existingByStudent = new Map(entries.map((e) => [e.studentId, e]));

  const students = await db.student.findMany({
    where: { schoolId, streamId, status: "ACTIVE" },
    select: { id: true },
  });

  await db.$transaction(
    students.map((s) => {
      const raw = toStr(formData.get(`status_${s.id}`)) || "PRESENT";
      const status = (["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).includes(raw as never)
        ? (raw as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED")
        : "PRESENT";
      const note = toStr(formData.get(`note_${s.id}`)) || null;
      const existing = existingByStudent.get(s.id);
      if (existing) {
        return db.attendance.update({
          where: { id: existing.id },
          data: { status, note, markedById: session.user.id },
        });
      }
      return db.attendance.create({
        data: {
          schoolId,
          studentId: s.id,
          streamId,
          classId: stream.classId,
          subjectId,
          date: day,
          status,
          markedById: session.user.id,
          note,
        },
      });
    })
  );

  await auditor(session).log({
    action: "CREATE",
    entity: "attendance",
    details: { date: dateStr, streamId, students: students.length },
  });
  revalidatePath("/attendance");
}

// ------------------------------------------------------------------
// Exams & Results
// ------------------------------------------------------------------

export async function createExam(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "exams.create");
  const schoolId = getSchoolId(session);

  const name = toStr(formData.get("name"));
  const termId = toStr(formData.get("termId"));
  if (!name || !termId) return error("Exam name and term are required");

  const term = await db.term.findFirst({ where: { id: termId, schoolId } });
  if (!term) return error("Term not found");

  const exam = await db.exam.create({
    data: {
      schoolId,
      name,
      type: enumOf(toStr(formData.get("type")), ["TEST", "MID_TERM", "END_OF_TERM", "MOCK", "FINAL"] as const, "TEST"),
      academicYearId: term.academicYearId,
      termId,
      gradeScaleId: toStr(formData.get("gradeScaleId")) || null,
      startDate: toDate(toStr(formData.get("startDate"))) ?? new Date(),
      endDate: toDate(toStr(formData.get("endDate"))) ?? new Date(),
      description: toStr(formData.get("description")) || null,
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "exam", entityId: exam.id });
  revalidatePath("/exams");
}

export async function updateExam(examId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "exams.edit");
  const schoolId = getSchoolId(session);
  const existing = await db.exam.findFirst({ where: { id: examId, schoolId } });
  if (!existing) return error("Exam not found");

  const termId = toStr(formData.get("termId"));
  const term = termId ? await db.term.findFirst({ where: { id: termId, schoolId } }) : null;

  const gradeScaleId = toStr(formData.get("gradeScaleId")) || null;
  if (gradeScaleId) {
    const gradeScale = await db.gradeScale.findFirst({ where: { id: gradeScaleId, schoolId } });
    if (!gradeScale) return error("Invalid grade scale");
  }

  await db.exam.update({
    where: { id: examId },
    data: {
      name: toStr(formData.get("name")) || existing.name,
      type: enumOf(toStr(formData.get("type")), ["TEST", "MID_TERM", "END_OF_TERM", "MOCK", "FINAL"] as const, existing.type),
      ...(term
        ? { termId: term.id, academicYearId: term.academicYearId }
        : {}),
      gradeScaleId,
      startDate: toDate(toStr(formData.get("startDate"))) ?? existing.startDate,
      endDate: toDate(toStr(formData.get("endDate"))) ?? existing.endDate,
      description: toStr(formData.get("description")) || null,
    },
  });
  await auditor(session).log({ action: "UPDATE", entity: "exam", entityId: examId });
  revalidatePath("/exams");
  revalidatePath(`/exams/${examId}`);
}

export async function deleteExam(examId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "exams.delete");
  const schoolId = getSchoolId(session);
  const existing = await db.exam.findFirst({ where: { id: examId, schoolId } });
  if (!existing) return error("Exam not found");
  await db.exam.delete({ where: { id: examId } });
  await auditor(session).log({ action: "DELETE", entity: "exam", entityId: examId });
  revalidatePath("/exams");
}

export async function publishExam(examId: string, published: boolean) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "exams.publish");
  const schoolId = getSchoolId(session);
  const existing = await db.exam.findFirst({ where: { id: examId, schoolId } });
  if (!existing) return error("Exam not found");

  if (published) {
    await computePositions(examId, schoolId);
  }

  await db.exam.update({ where: { id: examId }, data: { isPublished: published } });
  await auditor(session).log({ action: "PUBLISH", entity: "exam", entityId: examId });
  revalidatePath("/exams");
  revalidatePath(`/exams/${examId}`);
  revalidatePath("/results");
}

async function computePositions(examId: string, schoolId: string) {
  const exam = await db.exam.findFirst({
    where: { id: examId, schoolId },
    include: { subjects: { select: { id: true } } },
  });
  if (!exam) return;

  const results = await db.result.findMany({
    where: { examId, schoolId },
    select: { studentId: true, percentage: true },
  });

  const byStudent = new Map<string, number>();
  for (const r of results) {
    byStudent.set(r.studentId, (byStudent.get(r.studentId) ?? 0) + Number(r.percentage));
  }

  const ranked = [...byStudent.entries()]
    .map(([studentId, total]) => ({ studentId, total }))
    .sort((a, b) => b.total - a.total);

  const positions = new Map<string, number>();
  ranked.forEach((r, i) => positions.set(r.studentId, i + 1));

  await db.$transaction(
    [...positions.entries()].map(([studentId, position]) =>
      db.result.updateMany({
        where: { examId, studentId, schoolId },
        data: { position },
      })
    )
  );
}

export async function saveMarks(examSubjectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "results.enter");
  const schoolId = getSchoolId(session);

  const examSubject = await db.examSubject.findFirst({ where: { id: examSubjectId, schoolId } });
  if (!examSubject) return error("Exam subject not found");

  const maxMark = Number(examSubject.maxMark) || 100;
  const passMark = Number(examSubject.passMark) || 40;
  const gradeScale = examSubject.examId
    ? await db.exam.findFirst({ where: { id: examSubject.examId, schoolId }, select: { gradeScale: { include: { bands: true } } } })
    : null;

  const students = await db.enrollment.findMany({
    where: { classId: examSubject.classId, schoolId },
    include: { student: { select: { firstName: true, middleName: true, lastName: true } } },
  });

  const marksErrors = marksFieldErrors(
    students.map(({ studentId, student }) => ({
      inputName: `mark_${studentId}`,
      studentName: fullName(student.firstName, student.middleName, student.lastName),
      raw: toStr(formData.get(`mark_${studentId}`)),
      maxMark,
    }))
  );
  if (Object.keys(marksErrors).length) {
    return error("Please fix the highlighted marks.", marksErrors);
  }

  const existing = await db.result.findMany({
    where: { examSubjectId, schoolId },
    select: { studentId: true, id: true },
  });
  const existingByStudent = new Map(existing.map((e) => [e.studentId, e.id]));

  const teacher = await db.teacher.findFirst({ where: { schoolId, userId: session.user.id } });
  const fallbackTeacher = await db.teacher.findFirst({ where: { schoolId } });

  const ops = students.map(({ studentId }) => {
    const raw = toStr(formData.get(`mark_${studentId}`));
    if (!raw) return null;
    const mark = toFloat(raw);
    const percentage = maxMark > 0 ? (mark / maxMark) * 100 : 0;
    let grade: string | null = null;
    let points = 0;
    const scale = gradeScale?.gradeScale;
    if (scale) {
      for (const band of scale.bands) {
        if (percentage >= Number(band.min) && percentage <= Number(band.max)) {
          grade = band.grade;
          points = Number(band.points);
          break;
        }
      }
    }
    const data = {
      rawMark: mark,
      percentage: Math.round(percentage * 100) / 100,
      grade,
      points,
      comment: toStr(formData.get(`comment_${studentId}`)) || null,
      enteredById: teacher?.id ?? fallbackTeacher?.id ?? session.user.id,
    };
    const id = existingByStudent.get(studentId);
    if (id) {
      return db.result.update({ where: { id }, data });
    }
    return db.result.create({
      data: {
        schoolId,
        examId: examSubject.examId,
        examSubjectId,
        studentId,
        ...data,
      },
    });
  });

  const validOps = ops.filter(Boolean) as NonNullable<typeof ops[0]>[];
  if (validOps.length) await db.$transaction(validOps);

  await auditor(session).log({
    action: "ENTER_MARKS",
    entity: "result",
    details: { examSubjectId, students: validOps.length },
  });
  revalidatePath(`/exams/${examSubject.examId}`);
  revalidatePath("/results");
}

export async function addExamSubject(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "exams.edit");
  const schoolId = getSchoolId(session);
  const examId = toStr(formData.get("examId"));
  const subjectId = toStr(formData.get("subjectId"));
  const classId = toStr(formData.get("classId"));
  if (!examId || !subjectId || !classId) return error("All fields are required");

  const exam = await db.exam.findFirst({ where: { id: examId, schoolId } });
  if (!exam) return error("Exam not found");

  const subject = await db.subject.findFirst({ where: { id: subjectId, schoolId } });
  if (!subject) return error("Subject not found");
  const cls = await db.class.findFirst({ where: { id: classId, schoolId } });
  if (!cls) return error("Class not found");

  await db.examSubject.upsert({
    where: { examId_subjectId_classId: { examId, subjectId, classId } },
    create: {
      schoolId,
      examId,
      subjectId,
      classId,
      date: toDate(toStr(formData.get("date"))),
      maxMark: toFloat(formData.get("maxMark"), 100),
      passMark: toFloat(formData.get("passMark"), 40),
      weight: toFloat(formData.get("weight"), 1),
    },
    update: {
      date: toDate(toStr(formData.get("date"))),
      maxMark: toFloat(formData.get("maxMark"), 100),
      passMark: toFloat(formData.get("passMark"), 40),
      weight: toFloat(formData.get("weight"), 1),
    },
  });
  revalidatePath(`/exams/${examId}`);
}

export async function removeExamSubject(examSubjectId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "exams.edit");
  const schoolId = getSchoolId(session);
  const es = await db.examSubject.findFirst({ where: { id: examSubjectId, schoolId } });
  if (!es) return error("Not found");
  await db.examSubject.delete({ where: { id: examSubjectId } });
  revalidatePath(`/exams/${es.examId}`);
}

// ------------------------------------------------------------------
// Timetable
// ------------------------------------------------------------------

export async function addTimetableEntry(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "timetable.manage");
  const schoolId = getSchoolId(session);

  const classId = toStr(formData.get("classId"));
  const streamId = toStr(formData.get("streamId")) || null;
  const teacherId = toStr(formData.get("teacherId"));
  const subjectId = toStr(formData.get("subjectId"));
  const dayOfWeek = toInt(formData.get("dayOfWeek"), 1);
  const period = toInt(formData.get("period"), 1);
  const startTime = toStr(formData.get("startTime"));
  const endTime = toStr(formData.get("endTime"));

  if (!classId || !teacherId || !subjectId || !startTime || !endTime) {
    return error("All fields are required");
  }

  const [cls, stream, teacher, subject] = await Promise.all([
    db.class.findFirst({ where: { id: classId, schoolId } }),
    streamId ? db.stream.findFirst({ where: { id: streamId, schoolId } }) : Promise.resolve(null),
    db.teacher.findFirst({ where: { id: teacherId, schoolId } }),
    db.subject.findFirst({ where: { id: subjectId, schoolId } }),
  ]);
  if (!cls || !teacher || !subject || (streamId && !stream)) return error("Invalid class, stream, teacher or subject");
  if (stream && stream.classId !== classId) return error("Stream does not belong to the selected class");

  await db.timetableEntry.create({
    data: {
      schoolId,
      classId,
      streamId,
      teacherId,
      subjectId,
      dayOfWeek,
      period,
      startTime,
      endTime,
      room: toStr(formData.get("room")) || null,
    },
  });
  revalidatePath("/timetable");
}

export async function deleteTimetableEntry(entryId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "timetable.manage");
  const schoolId = getSchoolId(session);
  const entry = await db.timetableEntry.findFirst({ where: { id: entryId, schoolId } });
  if (!entry) return error("Not found");
  await db.timetableEntry.delete({ where: { id: entryId } });
  revalidatePath("/timetable");
}

// ------------------------------------------------------------------
// Assignments
// ------------------------------------------------------------------

export async function createAssignment(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "assignments.create");
  const schoolId = getSchoolId(session);

  const title = toStr(formData.get("title"));
  const classId = toStr(formData.get("classId"));
  const subjectId = toStr(formData.get("subjectId"));
  const dueDate = toDate(toStr(formData.get("dueDate")));
  if (!title || !classId || !subjectId || !dueDate) return error("All fields are required");

  const teacher = await db.teacher.findFirst({
    where: { OR: [{ userId: session.user.id }, { schoolId }] },
    orderBy: { joiningDate: "asc" },
  });
  if (!teacher) return error("No teacher record linked to your account");

  const [cls, subject] = await Promise.all([
    db.class.findFirst({ where: { id: classId, schoolId } }),
    db.subject.findFirst({ where: { id: subjectId, schoolId } }),
  ]);
  if (!cls || !subject) return error("Invalid class or subject");

  const assignment = await db.assignment.create({
    data: {
      schoolId,
      title,
      description: toStr(formData.get("description")) || null,
      instructions: toStr(formData.get("instructions")) || null,
      subjectId,
      classId,
      teacherId: teacher.id,
      dueDate,
      attachmentUrl: null,
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "assignment", entityId: assignment.id });
  revalidatePath("/assignments");
}

export async function deleteAssignment(assignmentId: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  requireAnyPermission(session, ["assignments.create", "assignments.grade"]);
  const schoolId = getSchoolId(session);
  const existing = await db.assignment.findFirst({ where: { id: assignmentId, schoolId } });
  if (!existing) return error("Not found");
  await db.assignment.delete({ where: { id: assignmentId } });
  revalidatePath("/assignments");
}

export async function gradeSubmission(submissionId: string, grade: number, feedback: string) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "assignments.grade");
  const schoolId = getSchoolId(session);
  const sub = await db.assignmentSubmission.findFirst({
    where: { id: submissionId, schoolId },
    include: { assignment: true },
  });
  if (!sub) return error("Submission not found");
  await db.assignmentSubmission.update({
    where: { id: submissionId },
    data: { grade, feedback: feedback || null },
  });
  revalidatePath(`/assignments`);
  revalidatePath(`/assignments/${sub.assignmentId}`);
}
