"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uid } from "@/lib/format";
import { auditor } from "@/lib/audit";
import { assertPermission, getSchoolId, toStr, toDate } from "@/lib/server-helpers";
import { success } from "@/lib/action-result";
import { enforceLimit } from "@/lib/limits";

function fail(message?: string, fieldErrors?: Record<string, string>) {
  return { ok: false as const, error: message ?? "An error occurred", fieldErrors };
}

function zodFieldErrors(issues: z.ZodIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

// ------------------------------------------------------------------
// Students
// ------------------------------------------------------------------

const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  dateOfBirth: z.string().optional(),
  nationality: z.string().default("Malawian"),
  admissionNumber: z.string().optional(),
  admissionDate: z.string().optional(),
  streamId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")).optional(),
  house: z.string().optional(),
  previousSchool: z.string().optional(),
  status: z.enum(["ACTIVE", "GRADUATED", "TRANSFERRED", "SUSPENDED", "WITHDRAWN"]).default("ACTIVE"),
});

function parseStudent(formData: FormData) {
  return studentSchema.safeParse({
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    lastName: formData.get("lastName"),
    gender: formData.get("gender"),
    dateOfBirth: formData.get("dateOfBirth"),
    nationality: formData.get("nationality"),
    admissionNumber: formData.get("admissionNumber"),
    admissionDate: formData.get("admissionDate"),
    streamId: formData.get("streamId"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    house: formData.get("house"),
    previousSchool: formData.get("previousSchool"),
    status: formData.get("status"),
  });
}

export async function createStudent(formData: FormData) {
  const validation = parseStudent(formData);
  if (!validation.success) return fail(validation.error.issues[0]?.message, zodFieldErrors(validation.error.issues));

  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "students.create");
  const schoolId = getSchoolId(session);

  const limitError = await enforceLimit(schoolId, "students");
  if (limitError) return fail(limitError);

  const v = validation.data;
  const admissionNumber = v.admissionNumber?.trim() || uid("STU");

  const existing = await db.student.findFirst({ where: { schoolId, admissionNumber } });
  if (existing) return fail("Admission number already exists.", { admissionNumber: "Admission number already exists." });

  const student = await db.student.create({
    data: {
      schoolId,
      admissionNumber,
      firstName: v.firstName,
      middleName: v.middleName?.trim() || undefined,
      lastName: v.lastName,
      gender: v.gender,
      dateOfBirth: toDate(v.dateOfBirth) ?? undefined,
      nationality: v.nationality,
      admissionDate: toDate(v.admissionDate) ?? undefined,
      streamId: v.streamId || undefined,
      phone: v.phone?.trim() || undefined,
      email: v.email?.trim().toLowerCase() || undefined,
      house: v.house?.trim() || undefined,
      previousSchool: v.previousSchool?.trim() || undefined,
      status: v.status,
    },
  });

  await auditor(session).log({ action: "CREATE", entity: "student", entityId: student.id });
  revalidatePath("/students");
  return success(student);
}

export async function updateStudent(id: string, formData: FormData) {
  const validation = parseStudent(formData);
  if (!validation.success) return fail(validation.error.issues[0]?.message, zodFieldErrors(validation.error.issues));

  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "students.edit");
  const schoolId = getSchoolId(session);

  const current = await db.student.findFirst({ where: { id, schoolId } });
  if (!current) return fail("Student not found");

  const v = validation.data;
  const admissionNumber = v.admissionNumber?.trim() || current.admissionNumber;

  const existing = await db.student.findFirst({ where: { schoolId, admissionNumber } });
  if (existing && existing.id !== id)
    return fail("Admission number already exists.", { admissionNumber: "Admission number already exists." });

  await db.student.update({
    where: { id },
    data: {
      firstName: v.firstName,
      middleName: v.middleName?.trim() || undefined,
      lastName: v.lastName,
      gender: v.gender,
      dateOfBirth: toDate(v.dateOfBirth) ?? undefined,
      nationality: v.nationality,
      admissionNumber,
      admissionDate: toDate(v.admissionDate) ?? undefined,
      streamId: v.streamId || undefined,
      phone: v.phone?.trim() || undefined,
      email: v.email?.trim().toLowerCase() || undefined,
      house: v.house?.trim() || undefined,
      previousSchool: v.previousSchool?.trim() || undefined,
      status: v.status,
    },
  });

  await auditor(session).log({ action: "UPDATE", entity: "student", entityId: id });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return success();
}

// ------------------------------------------------------------------
// Parents
// ------------------------------------------------------------------

const parentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address").or(z.literal("")).optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  relationship: z.string().default("Other"),
  isEmergency: z.preprocess((v) => (v === "on" ? "on" : undefined), z.enum(["on"]).optional()),
});

function parseParent(formData: FormData) {
  return parentSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    occupation: formData.get("occupation"),
    relationship: formData.get("relationship"),
    isEmergency: formData.get("isEmergency"),
  });
}

export async function createParent(formData: FormData) {
  const validation = parseParent(formData);
  if (!validation.success) return fail(validation.error.issues[0]?.message, zodFieldErrors(validation.error.issues));

  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "parents.create");
  const schoolId = getSchoolId(session);

  const v = validation.data;
  const parent = await db.parent.create({
    data: {
      schoolId,
      firstName: v.firstName,
      lastName: v.lastName,
      phone: v.phone,
      email: v.email?.trim() || undefined,
      address: v.address?.trim() || undefined,
      occupation: v.occupation?.trim() || undefined,
      relationship: v.relationship || "Other",
      isEmergency: v.isEmergency === "on",
    },
  });

  await auditor(session).log({ action: "CREATE", entity: "parent", entityId: parent.id });
  revalidatePath("/parents");
  return success(parent);
}

export async function updateParent(id: string, formData: FormData) {
  const validation = parseParent(formData);
  if (!validation.success) return fail(validation.error.issues[0]?.message, zodFieldErrors(validation.error.issues));

  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "parents.edit");
  const schoolId = getSchoolId(session);

  const existing = await db.parent.findFirst({ where: { id, schoolId } });
  if (!existing) return fail("Parent not found");

  const v = validation.data;
  await db.parent.update({
    where: { id },
    data: {
      firstName: v.firstName,
      lastName: v.lastName,
      phone: v.phone,
      email: v.email?.trim() || undefined,
      address: v.address?.trim() || undefined,
      occupation: v.occupation?.trim() || undefined,
      relationship: v.relationship || "Other",
      isEmergency: v.isEmergency === "on",
    },
  });

  await auditor(session).log({ action: "UPDATE", entity: "parent", entityId: id });
  revalidatePath("/parents");
  return success();
}

// ------------------------------------------------------------------
// Teachers
// ------------------------------------------------------------------

const teacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")).optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  joiningDate: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).default("FULL_TIME"),
  salary: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"]).default("ACTIVE"),
});

function parseTeacher(formData: FormData) {
  return teacherSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    gender: formData.get("gender"),
    dateOfBirth: formData.get("dateOfBirth"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    qualification: formData.get("qualification"),
    specialization: formData.get("specialization"),
    joiningDate: formData.get("joiningDate"),
    employmentType: formData.get("employmentType"),
    salary: formData.get("salary"),
    status: formData.get("status"),
  });
}

export async function createTeacher(formData: FormData) {
  const validation = parseTeacher(formData);
  if (!validation.success) return fail(validation.error.issues[0]?.message, zodFieldErrors(validation.error.issues));

  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "teachers.create");
  const schoolId = getSchoolId(session);

  const limitError = await enforceLimit(schoolId, "teachers");
  if (limitError) return fail(limitError);

  const v = validation.data;
  const teacher = await db.teacher.create({
    data: {
      schoolId,
      employeeId: uid("TEA"),
      firstName: v.firstName,
      lastName: v.lastName,
      gender: v.gender,
      dateOfBirth: toDate(v.dateOfBirth) ?? undefined,
      phone: v.phone?.trim() || undefined,
      email: v.email?.trim().toLowerCase() || undefined,
      address: v.address?.trim() || undefined,
      qualification: v.qualification?.trim() || undefined,
      specialization: v.specialization?.trim() || undefined,
      joiningDate: toDate(v.joiningDate) ?? undefined,
      employmentType: v.employmentType,
      salary: v.salary ? Number(v.salary) : undefined,
      status: v.status,
    },
  });

  await auditor(session).log({ action: "CREATE", entity: "teacher", entityId: teacher.id });
  revalidatePath("/teachers");
  return success(teacher);
}

export async function updateTeacher(id: string, formData: FormData) {
  const validation = parseTeacher(formData);
  if (!validation.success) return fail(validation.error.issues[0]?.message, zodFieldErrors(validation.error.issues));

  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "teachers.edit");
  const schoolId = getSchoolId(session);

  const current = await db.teacher.findFirst({ where: { id, schoolId } });
  if (!current) return fail("Teacher not found");

  const v = validation.data;
  await db.teacher.update({
    where: { id },
    data: {
      firstName: v.firstName,
      lastName: v.lastName,
      gender: v.gender,
      dateOfBirth: toDate(v.dateOfBirth) ?? undefined,
      phone: v.phone?.trim() || undefined,
      email: v.email?.trim().toLowerCase() || undefined,
      address: v.address?.trim() || undefined,
      qualification: v.qualification?.trim() || undefined,
      specialization: v.specialization?.trim() || undefined,
      joiningDate: toDate(v.joiningDate) ?? undefined,
      employmentType: v.employmentType,
      salary: v.salary ? Number(v.salary) : undefined,
      status: v.status,
    },
  });

  await auditor(session).log({ action: "UPDATE", entity: "teacher", entityId: id });
  revalidatePath("/teachers");
  revalidatePath(`/teachers/${id}`);
  return success();
}

// ------------------------------------------------------------------
// Staff
// ------------------------------------------------------------------

const staffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")).optional(),
  address: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  joiningDate: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).default("FULL_TIME"),
  salary: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"]).default("ACTIVE"),
});

function parseStaff(formData: FormData) {
  return staffSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    gender: formData.get("gender"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    position: formData.get("position"),
    department: formData.get("department"),
    joiningDate: formData.get("joiningDate"),
    employmentType: formData.get("employmentType"),
    salary: formData.get("salary"),
    status: formData.get("status"),
  });
}

export async function createStaff(formData: FormData) {
  const validation = parseStaff(formData);
  if (!validation.success) return fail(validation.error.issues[0]?.message, zodFieldErrors(validation.error.issues));

  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "staff.create");
  const schoolId = getSchoolId(session);

  const limitError = await enforceLimit(schoolId, "staff");
  if (limitError) return fail(limitError);

  const v = validation.data;
  const staff = await db.staff.create({
    data: {
      schoolId,
      employeeId: uid("STA"),
      firstName: v.firstName,
      lastName: v.lastName,
      gender: v.gender,
      phone: v.phone?.trim() || undefined,
      email: v.email?.trim().toLowerCase() || undefined,
      address: v.address?.trim() || undefined,
      position: v.position?.trim() || undefined,
      department: v.department?.trim() || undefined,
      joiningDate: toDate(v.joiningDate) ?? undefined,
      employmentType: v.employmentType,
      salary: v.salary ? Number(v.salary) : undefined,
      status: v.status,
    },
  });

  await auditor(session).log({ action: "CREATE", entity: "staff", entityId: staff.id });
  revalidatePath("/staff");
  return success(staff);
}

export async function updateStaff(id: string, formData: FormData) {
  const validation = parseStaff(formData);
  if (!validation.success) return fail(validation.error.issues[0]?.message, zodFieldErrors(validation.error.issues));

  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "staff.edit");
  const schoolId = getSchoolId(session);

  const current = await db.staff.findFirst({ where: { id, schoolId } });
  if (!current) return fail("Staff member not found");

  const v = validation.data;
  await db.staff.update({
    where: { id },
    data: {
      firstName: v.firstName,
      lastName: v.lastName,
      gender: v.gender,
      phone: v.phone?.trim() || undefined,
      email: v.email?.trim().toLowerCase() || undefined,
      address: v.address?.trim() || undefined,
      position: v.position?.trim() || undefined,
      department: v.department?.trim() || undefined,
      joiningDate: toDate(v.joiningDate) ?? undefined,
      employmentType: v.employmentType,
      salary: v.salary ? Number(v.salary) : undefined,
      status: v.status,
    },
  });

  await auditor(session).log({ action: "UPDATE", entity: "staff", entityId: id });
  revalidatePath("/staff");
  return success();
}

// ------------------------------------------------------------------
// Delete operations
// ------------------------------------------------------------------

export async function deleteParent(id: string, _formData?: FormData) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "parents.delete");
  const schoolId = getSchoolId(session);
  const existing = await db.parent.findFirst({ where: { id, schoolId } });
  if (!existing) return fail("Parent not found");
  await db.parent.delete({ where: { id } });
  await auditor(session).log({ action: "DELETE", entity: "parent", entityId: id });
  revalidatePath("/parents");
  return success();
}

export async function deleteStaff(id: string, _formData?: FormData) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "staff.delete");
  const schoolId = getSchoolId(session);
  const existing = await db.staff.findFirst({ where: { id, schoolId } });
  if (!existing) return fail("Staff member not found");
  await db.staff.delete({ where: { id } });
  await auditor(session).log({ action: "DELETE", entity: "staff", entityId: id });
  revalidatePath("/staff");
  return success();
}

export async function deleteTeacher(id: string, _formData?: FormData) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "teachers.delete");
  const schoolId = getSchoolId(session);
  const existing = await db.teacher.findFirst({ where: { id, schoolId } });
  if (!existing) return fail("Teacher not found");
  await db.teacher.delete({ where: { id } });
  await auditor(session).log({ action: "DELETE", entity: "teacher", entityId: id });
  revalidatePath("/teachers");
  return success();
}

export async function deleteStudent(id: string, _formData?: FormData) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "students.delete");
  const schoolId = getSchoolId(session);
  const existing = await db.student.findFirst({ where: { id, schoolId } });
  if (!existing) return fail("Student not found");
  await db.student.delete({ where: { id } });
  await auditor(session).log({ action: "DELETE", entity: "student", entityId: id });
  revalidatePath("/students");
  return success();
}

// ------------------------------------------------------------------
// Student relationships and notes
// ------------------------------------------------------------------

export async function linkParent(studentId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "parents.edit");
  const schoolId = getSchoolId(session);

  const parentId = toStr(formData.get("parentId"));
  if (!parentId) return fail("Parent is required");

  const parent = await db.parent.findFirst({ where: { id: parentId, schoolId } });
  if (!parent) return fail("Parent not found");

  const student = await db.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) return fail("Student not found");

  await db.studentParent.upsert({
    where: { studentId_parentId: { studentId, parentId } },
    create: { schoolId, studentId, parentId },
    update: {},
  });

  await auditor(session).log({ action: "UPDATE", entity: "student", entityId: studentId });
  revalidatePath(`/students/${studentId}`);
  return success();
}

export async function unlinkParent(studentId: string, parentId: string, _formData?: FormData) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "parents.edit");
  const schoolId = getSchoolId(session);

  await db.studentParent.deleteMany({ where: { studentId, parentId, schoolId } });

  await auditor(session).log({ action: "UPDATE", entity: "student", entityId: studentId });
  revalidatePath(`/students/${studentId}`);
  return success();
}

export async function addStudentNote(formData: FormData) {
  const session = await auth();
  if (!session?.user) return fail("Unauthorized");
  assertPermission(session, "students.view");
  const schoolId = getSchoolId(session);

  const studentId = toStr(formData.get("studentId"));
  const title = toStr(formData.get("title"));
  const body = toStr(formData.get("body"));
  const userId = session.user.id;
  if (!userId) return fail("Unauthorized");
  if (!studentId) return fail("Student is required");
  if (!title) return fail("Note title is required");

  const student = await db.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) return fail("Student not found");

  await db.studentNote.create({
    data: {
      schoolId,
      studentId,
      title,
      body: body || "",
      createdById: userId,
    },
  });

  await auditor(session).log({ action: "CREATE", entity: "student_note", entityId: studentId });
  revalidatePath(`/students/${studentId}`);
  return success();
}
