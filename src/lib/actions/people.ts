"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uid } from "@/lib/format";
import { auditor } from "@/lib/audit";
import {
  assertPermission,
  getSchoolId,
  isSuperAdminSession,
  toBool,
  toDate,
  toInt,
  toStr,
} from "@/lib/server-helpers";
import { titleCase } from "@/lib/constants";
import { createNotification } from "@/lib/notify";

const studentSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  gender: z.enum(["MALE", "FEMALE"]),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  admissionNumber: z.string().optional(),
  admissionDate: z.string().optional(),
  streamId: z.string().optional(),
  house: z.string().optional(),
  previousSchool: z.string().optional(),
  medicalNotes: z.string().optional(),
  status: z.enum(["ACTIVE", "GRADUATED", "TRANSFERRED", "SUSPENDED", "WITHDRAWN"]).optional(),
});

export async function createStudent(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "students.create");
  const schoolId = getSchoolId(session);

  const parsed = studentSchema.safeParse({
    firstName: toStr(formData.get("firstName")),
    middleName: toStr(formData.get("middleName")),
    lastName: toStr(formData.get("lastName")),
    gender: toStr(formData.get("gender")),
    dateOfBirth: toStr(formData.get("dateOfBirth")),
    nationality: toStr(formData.get("nationality")) || "Malawian",
    address: toStr(formData.get("address")),
    phone: toStr(formData.get("phone")),
    email: toStr(formData.get("email")),
    admissionNumber: toStr(formData.get("admissionNumber")),
    admissionDate: toStr(formData.get("admissionDate")),
    streamId: toStr(formData.get("streamId")),
    house: toStr(formData.get("house")),
    previousSchool: toStr(formData.get("previousSchool")),
    medicalNotes: toStr(formData.get("medicalNotes")),
    status: toStr(formData.get("status")),
  });
  if (!parsed.success) throw new Error("Invalid student data: " + parsed.error.issues[0]?.message);

  const d = parsed.data;
  const admissionNumber = d.admissionNumber || uid("STU");

  const student = await db.student.create({
    data: {
      schoolId,
      firstName: titleCase(d.firstName),
      middleName: d.middleName ? titleCase(d.middleName) : null,
      lastName: titleCase(d.lastName),
      gender: d.gender,
      dateOfBirth: toDate(d.dateOfBirth),
      nationality: d.nationality || "Malawian",
      address: d.address || null,
      phone: d.phone || null,
      email: d.email || null,
      admissionNumber,
      admissionDate: toDate(d.admissionDate) ?? new Date(),
      streamId: d.streamId || null,
      house: d.house || null,
      previousSchool: d.previousSchool || null,
      medicalNotes: d.medicalNotes || null,
      status: d.status ?? "ACTIVE",
    },
  });

  if (d.streamId) {
    const stream = await db.stream.findUnique({ where: { id: d.streamId } });
    if (stream) {
      await db.enrollment.create({
        data: {
          schoolId,
          studentId: student.id,
          classId: stream.classId,
          streamId: stream.id,
          status: d.status ?? "ACTIVE",
        },
      });
    }
  }

  await auditor(session).log({
    action: "CREATE",
    entity: "student",
    entityId: student.id,
    details: { name: student.firstName + " " + student.lastName },
  });

  revalidatePath("/students");
  revalidatePath("/dashboard");
}

export async function updateStudent(studentId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "students.edit");
  const schoolId = getSchoolId(session);

  const existing = await db.student.findFirst({ where: { id: studentId, schoolId } });
  if (!existing) throw new Error("Student not found");

  const parsed = studentSchema.safeParse({
    firstName: toStr(formData.get("firstName")),
    middleName: toStr(formData.get("middleName")),
    lastName: toStr(formData.get("lastName")),
    gender: toStr(formData.get("gender")),
    dateOfBirth: toStr(formData.get("dateOfBirth")),
    nationality: toStr(formData.get("nationality")) || "Malawian",
    address: toStr(formData.get("address")),
    phone: toStr(formData.get("phone")),
    email: toStr(formData.get("email")),
    admissionNumber: toStr(formData.get("admissionNumber")),
    admissionDate: toStr(formData.get("admissionDate")),
    streamId: toStr(formData.get("streamId")),
    house: toStr(formData.get("house")),
    previousSchool: toStr(formData.get("previousSchool")),
    medicalNotes: toStr(formData.get("medicalNotes")),
    status: toStr(formData.get("status")),
  });
  if (!parsed.success) throw new Error("Invalid student data");

  const d = parsed.data;
  await db.student.update({
    where: { id: studentId },
    data: {
      firstName: titleCase(d.firstName),
      middleName: d.middleName ? titleCase(d.middleName) : null,
      lastName: titleCase(d.lastName),
      gender: d.gender,
      dateOfBirth: toDate(d.dateOfBirth),
      nationality: d.nationality || "Malawian",
      address: d.address || null,
      phone: d.phone || null,
      email: d.email || null,
      admissionNumber: d.admissionNumber || existing.admissionNumber,
      admissionDate: toDate(d.admissionDate) ?? existing.admissionDate,
      streamId: d.streamId || null,
      house: d.house || null,
      previousSchool: d.previousSchool || null,
      medicalNotes: d.medicalNotes || null,
      status: d.status ?? existing.status,
    },
  });

  await auditor(session).log({
    action: "UPDATE",
    entity: "student",
    entityId: studentId,
  });
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/dashboard");
}

export async function deleteStudent(studentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "students.delete");
  const schoolId = getSchoolId(session);

  const existing = await db.student.findFirst({ where: { id: studentId, schoolId } });
  if (!existing) throw new Error("Student not found");

  await db.student.delete({ where: { id: studentId } });
  await auditor(session).log({ action: "DELETE", entity: "student", entityId: studentId });
  revalidatePath("/students");
}

export async function addStudentNote(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const schoolId = getSchoolId(session);
  const studentId = toStr(formData.get("studentId"));
  const title = toStr(formData.get("title"));
  const body = toStr(formData.get("body"));

  if (!studentId || !title) throw new Error("Title and student are required");

  const student = await db.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) throw new Error("Student not found");

  await db.studentNote.create({
    data: {
      schoolId,
      studentId,
      title,
      body: body,
      createdById: session.user.id,
    },
  });
  revalidatePath(`/students/${studentId}`);
}

export async function linkParent(studentId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "parents.edit");
  const schoolId = getSchoolId(session);
  const parentId = toStr(formData.get("parentId"));
  if (!parentId) throw new Error("Select a parent");

  const parent = await db.parent.findFirst({ where: { id: parentId, schoolId } });
  if (!parent) throw new Error("Parent not found");

  await db.studentParent.upsert({
    where: { studentId_parentId: { studentId, parentId } },
    create: { schoolId, studentId, parentId },
    update: {},
  });
  revalidatePath(`/students/${studentId}`);
}

export async function unlinkParent(studentId: string, parentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const schoolId = getSchoolId(session);
  await db.studentParent.deleteMany({ where: { studentId, parentId, schoolId } });
  revalidatePath(`/students/${studentId}`);
}

const parentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  occupation: z.string().optional(),
  relationship: z.string().min(1),
  isEmergency: z.string().optional(),
});

export async function createParent(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "parents.create");
  const schoolId = getSchoolId(session);

  const parsed = parentSchema.safeParse({
    firstName: toStr(formData.get("firstName")),
    lastName: toStr(formData.get("lastName")),
    phone: toStr(formData.get("phone")),
    email: toStr(formData.get("email")),
    address: toStr(formData.get("address")),
    occupation: toStr(formData.get("occupation")),
    relationship: toStr(formData.get("relationship")),
    isEmergency: toStr(formData.get("isEmergency")),
  });
  if (!parsed.success) throw new Error("Invalid parent data");

  const d = parsed.data;
  const parent = await db.parent.create({
    data: {
      schoolId,
      firstName: titleCase(d.firstName),
      lastName: titleCase(d.lastName),
      phone: d.phone,
      email: d.email || null,
      address: d.address || null,
      occupation: d.occupation || null,
      relationship: d.relationship,
      isEmergency: toBool(d.isEmergency),
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "parent", entityId: parent.id });
  revalidatePath("/parents");
}

export async function updateParent(parentId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "parents.edit");
  const schoolId = getSchoolId(session);

  const existing = await db.parent.findFirst({ where: { id: parentId, schoolId } });
  if (!existing) throw new Error("Parent not found");

  const parsed = parentSchema.safeParse({
    firstName: toStr(formData.get("firstName")),
    lastName: toStr(formData.get("lastName")),
    phone: toStr(formData.get("phone")),
    email: toStr(formData.get("email")),
    address: toStr(formData.get("address")),
    occupation: toStr(formData.get("occupation")),
    relationship: toStr(formData.get("relationship")),
    isEmergency: toStr(formData.get("isEmergency")),
  });
  if (!parsed.success) throw new Error("Invalid parent data");

  const d = parsed.data;
  await db.parent.update({
    where: { id: parentId },
    data: {
      firstName: titleCase(d.firstName),
      lastName: titleCase(d.lastName),
      phone: d.phone,
      email: d.email || null,
      address: d.address || null,
      occupation: d.occupation || null,
      relationship: d.relationship,
      isEmergency: toBool(d.isEmergency),
    },
  });
  await auditor(session).log({ action: "UPDATE", entity: "parent", entityId: parentId });
  revalidatePath("/parents");
}

export async function deleteParent(parentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "parents.delete");
  const schoolId = getSchoolId(session);
  const existing = await db.parent.findFirst({ where: { id: parentId, schoolId } });
  if (!existing) throw new Error("Parent not found");
  await db.parent.delete({ where: { id: parentId } });
  await auditor(session).log({ action: "DELETE", entity: "parent", entityId: parentId });
  revalidatePath("/parents");
}

const teacherSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.enum(["MALE", "FEMALE"]),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  joiningDate: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
  salary: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"]).optional(),
});

export async function createTeacher(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "teachers.create");
  const schoolId = getSchoolId(session);

  const parsed = teacherSchema.safeParse({
    firstName: toStr(formData.get("firstName")),
    lastName: toStr(formData.get("lastName")),
    gender: toStr(formData.get("gender")),
    dateOfBirth: toStr(formData.get("dateOfBirth")),
    phone: toStr(formData.get("phone")),
    email: toStr(formData.get("email")),
    address: toStr(formData.get("address")),
    qualification: toStr(formData.get("qualification")),
    specialization: toStr(formData.get("specialization")),
    joiningDate: toStr(formData.get("joiningDate")),
    employmentType: toStr(formData.get("employmentType")),
    salary: toStr(formData.get("salary")),
    status: toStr(formData.get("status")),
  });
  if (!parsed.success) throw new Error("Invalid teacher data");

  const d = parsed.data;
  const employeeId = uid("TCH");

  const teacher = await db.teacher.create({
    data: {
      schoolId,
      employeeId,
      firstName: titleCase(d.firstName),
      lastName: titleCase(d.lastName),
      gender: d.gender,
      dateOfBirth: toDate(d.dateOfBirth),
      phone: d.phone || null,
      email: d.email || null,
      address: d.address || null,
      qualification: d.qualification || null,
      specialization: d.specialization || null,
      joiningDate: toDate(d.joiningDate),
      employmentType: d.employmentType ?? "FULL_TIME",
      salary: d.salary ? Number(d.salary) : 0,
      status: d.status ?? "ACTIVE",
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "teacher", entityId: teacher.id });
  revalidatePath("/teachers");
}

export async function updateTeacher(teacherId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "teachers.edit");
  const schoolId = getSchoolId(session);

  const existing = await db.teacher.findFirst({ where: { id: teacherId, schoolId } });
  if (!existing) throw new Error("Teacher not found");

  const parsed = teacherSchema.safeParse({
    firstName: toStr(formData.get("firstName")),
    lastName: toStr(formData.get("lastName")),
    gender: toStr(formData.get("gender")),
    dateOfBirth: toStr(formData.get("dateOfBirth")),
    phone: toStr(formData.get("phone")),
    email: toStr(formData.get("email")),
    address: toStr(formData.get("address")),
    qualification: toStr(formData.get("qualification")),
    specialization: toStr(formData.get("specialization")),
    joiningDate: toStr(formData.get("joiningDate")),
    employmentType: toStr(formData.get("employmentType")),
    salary: toStr(formData.get("salary")),
    status: toStr(formData.get("status")),
  });
  if (!parsed.success) throw new Error("Invalid teacher data");

  const d = parsed.data;
  await db.teacher.update({
    where: { id: teacherId },
    data: {
      firstName: titleCase(d.firstName),
      lastName: titleCase(d.lastName),
      gender: d.gender,
      dateOfBirth: toDate(d.dateOfBirth),
      phone: d.phone || null,
      email: d.email || null,
      address: d.address || null,
      qualification: d.qualification || null,
      specialization: d.specialization || null,
      joiningDate: toDate(d.joiningDate),
      employmentType: d.employmentType ?? existing.employmentType,
      salary: d.salary ? Number(d.salary) : existing.salary,
      status: d.status ?? existing.status,
    },
  });
  await auditor(session).log({ action: "UPDATE", entity: "teacher", entityId: teacherId });
  revalidatePath("/teachers");
  revalidatePath(`/teachers/${teacherId}`);
}

export async function deleteTeacher(teacherId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "teachers.delete");
  const schoolId = getSchoolId(session);
  const existing = await db.teacher.findFirst({ where: { id: teacherId, schoolId } });
  if (!existing) throw new Error("Teacher not found");
  await db.teacher.delete({ where: { id: teacherId } });
  await auditor(session).log({ action: "DELETE", entity: "teacher", entityId: teacherId });
  revalidatePath("/teachers");
}

const staffSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  joiningDate: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional(),
  salary: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"]).optional(),
});

export async function createStaff(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "staff.create");
  const schoolId = getSchoolId(session);

  const parsed = staffSchema.safeParse({
    firstName: toStr(formData.get("firstName")),
    lastName: toStr(formData.get("lastName")),
    gender: toStr(formData.get("gender")),
    phone: toStr(formData.get("phone")),
    email: toStr(formData.get("email")),
    address: toStr(formData.get("address")),
    position: toStr(formData.get("position")),
    department: toStr(formData.get("department")),
    joiningDate: toStr(formData.get("joiningDate")),
    employmentType: toStr(formData.get("employmentType")),
    salary: toStr(formData.get("salary")),
    status: toStr(formData.get("status")),
  });
  if (!parsed.success) throw new Error("Invalid staff data");

  const d = parsed.data;
  const staff = await db.staff.create({
    data: {
      schoolId,
      employeeId: uid("STF"),
      firstName: titleCase(d.firstName),
      lastName: titleCase(d.lastName),
      gender: d.gender,
      phone: d.phone || null,
      email: d.email || null,
      address: d.address || null,
      position: d.position || null,
      department: d.department || null,
      joiningDate: toDate(d.joiningDate),
      employmentType: d.employmentType ?? "FULL_TIME",
      salary: d.salary ? Number(d.salary) : 0,
      status: d.status ?? "ACTIVE",
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "staff", entityId: staff.id });
  revalidatePath("/staff");
}

export async function updateStaff(staffId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "staff.edit");
  const schoolId = getSchoolId(session);

  const existing = await db.staff.findFirst({ where: { id: staffId, schoolId } });
  if (!existing) throw new Error("Staff not found");

  const parsed = staffSchema.safeParse({
    firstName: toStr(formData.get("firstName")),
    lastName: toStr(formData.get("lastName")),
    gender: toStr(formData.get("gender")),
    phone: toStr(formData.get("phone")),
    email: toStr(formData.get("email")),
    address: toStr(formData.get("address")),
    position: toStr(formData.get("position")),
    department: toStr(formData.get("department")),
    joiningDate: toStr(formData.get("joiningDate")),
    employmentType: toStr(formData.get("employmentType")),
    salary: toStr(formData.get("salary")),
    status: toStr(formData.get("status")),
  });
  if (!parsed.success) throw new Error("Invalid staff data");

  const d = parsed.data;
  await db.staff.update({
    where: { id: staffId },
    data: {
      firstName: titleCase(d.firstName),
      lastName: titleCase(d.lastName),
      gender: d.gender,
      phone: d.phone || null,
      email: d.email || null,
      address: d.address || null,
      position: d.position || null,
      department: d.department || null,
      joiningDate: toDate(d.joiningDate),
      employmentType: d.employmentType ?? existing.employmentType,
      salary: d.salary ? Number(d.salary) : existing.salary,
      status: d.status ?? existing.status,
    },
  });
  await auditor(session).log({ action: "UPDATE", entity: "staff", entityId: staffId });
  revalidatePath("/staff");
}

export async function deleteStaff(staffId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "staff.delete");
  const schoolId = getSchoolId(session);
  const existing = await db.staff.findFirst({ where: { id: staffId, schoolId } });
  if (!existing) throw new Error("Staff not found");
  await db.staff.delete({ where: { id: staffId } });
  await auditor(session).log({ action: "DELETE", entity: "staff", entityId: staffId });
  revalidatePath("/staff");
}

export async function toggleUserActive(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "users.manage");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (user.id === session.user.id) throw new Error("You cannot deactivate your own account");
  await db.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  await auditor(session).log({ action: "TOGGLE", entity: "user", entityId: userId });
  revalidatePath("/admin/users");
  revalidatePath("/settings");
}

export async function notifyStudents(streamId: string | null, message: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  assertPermission(session, "notices.manage");
  const schoolId = getSchoolId(session);

  const students = await db.student.findMany({
    where: { schoolId, status: "ACTIVE", ...(streamId ? { streamId } : {}) },
    include: { parents: { include: { parent: true } } },
  });

  for (const s of students) {
    const title = "School announcement";
    for (const sp of s.parents) {
      if (sp.parent.phone) {
        await createNotification({
          schoolId,
          userId: sp.parent.userId ?? session.user.id,
          title,
          body: message,
          link: "/notices",
        });
      }
    }
  }
  revalidatePath("/notices");
}
