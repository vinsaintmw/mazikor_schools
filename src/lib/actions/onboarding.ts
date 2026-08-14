"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { auditor } from "@/lib/audit";
import { assertPermission, getSchoolId, isValidHttpUrl, toDate, toFloat, toInt, toStr } from "@/lib/server-helpers";
import { error } from "@/lib/action-result";

const MAX_CLASSES = 30;
const MAX_SUBJECTS = 50;
const MAX_FEES = 50;

function rowIndexes(formData: FormData, fieldPrefix: string): number[] {
  const indexes = new Set<number>();
  for (const key of formData.keys()) {
    const match = key.match(new RegExp(`^${fieldPrefix}_(\\d+)$`));
    if (match) indexes.add(Number(match[1]));
  }
  return [...indexes].sort((a, b) => a - b);
}

export async function completeSetup(formData: FormData) {
  const session = await auth();
  if (!session?.user) return error("Unauthorized");
  assertPermission(session, "settings.manage");
  const schoolId = getSchoolId(session);

  const existing = await db.school.findUnique({
    where: { id: schoolId },
    include: { academicYears: { take: 1, select: { id: true } } },
  });
  if (!existing) return error("School not found");
  if (existing.academicYears.length) return error("This school has already been set up");

  // ---- School details -------------------------------------------------
  const name = toStr(formData.get("name"));
  if (!name) return error("School name is required", { name: "School name is required" });

  const logo = toStr(formData.get("logo")) || null;
  if (logo && !isValidHttpUrl(logo)) {
    return error("Logo must be a valid http(s) image URL", { logo: "Enter a valid http(s) URL" });
  }

  // ---- Academic year & terms ------------------------------------------
  const yearName = toStr(formData.get("yearName"));
  const yearStart = toDate(formData.get("yearStart"));
  const yearEnd = toDate(formData.get("yearEnd"));
  if (!yearName || !yearStart || !yearEnd) {
    return error("Academic year name, start and end dates are required", {
      ...(!yearName ? { yearName: "Academic year name is required" } : {}),
      ...(!yearStart ? { yearStart: "Start date is required" } : {}),
      ...(!yearEnd ? { yearEnd: "End date is required" } : {}),
    });
  }
  if (yearEnd < yearStart) {
    return error("Academic year end date must be after the start date", { yearEnd: "End date must be after the start date" });
  }

  const terms: { name: string; start: Date; end: Date }[] = [];
  for (const i of rowIndexes(formData, "termName")) {
    const termName = toStr(formData.get(`termName_${i}`));
    const start = toDate(formData.get(`termStart_${i}`));
    const end = toDate(formData.get(`termEnd_${i}`));
    if (!termName || !start || !end) continue;
    terms.push({ name: termName, start, end });
  }
  if (!terms.length) return error("At least one term is required");

  // ---- Classes ---------------------------------------------------------
  const classes: { name: string; level: number; capacity: number }[] = [];
  for (const i of rowIndexes(formData, "className")) {
    const className = toStr(formData.get(`className_${i}`));
    if (!className) continue;
    classes.push({
      name: className,
      level: toInt(formData.get(`classLevel_${i}`), 1),
      capacity: Math.max(1, toInt(formData.get(`classCapacity_${i}`), 40)),
    });
  }
  if (classes.length > MAX_CLASSES) return error(`Too many classes (max ${MAX_CLASSES})`);
  if (new Set(classes.map((c) => c.name.toLowerCase())).size !== classes.length) {
    return error("Class names must be unique", { className_0: "Class names must be unique" });
  }

  // ---- Subjects --------------------------------------------------------
  const subjects: { code: string; name: string; passMark: number; maxMark: number }[] = [];
  for (const i of rowIndexes(formData, "subjectCode")) {
    const code = toStr(formData.get(`subjectCode_${i}`)).toUpperCase();
    const subjectName = toStr(formData.get(`subjectName_${i}`));
    if (!code || !subjectName) continue;
    const maxMark = toFloat(formData.get(`subjectMaxMark_${i}`), 100);
    const passMark = toFloat(formData.get(`subjectPassMark_${i}`), 40);
    subjects.push({ code, name: subjectName, passMark, maxMark });
  }
  if (subjects.length > MAX_SUBJECTS) return error(`Too many subjects (max ${MAX_SUBJECTS})`);
  if (new Set(subjects.map((s) => s.code)).size !== subjects.length) {
    return error("Subject codes must be unique", { subjectCode_0: "Subject codes must be unique" });
  }

  // ---- Fee structures ---------------------------------------------------
  const fees: { name: string; category: string; amount: number; classIndex: number | null; termIndex: number | null }[] = [];
  for (const i of rowIndexes(formData, "feeName")) {
    const feeName = toStr(formData.get(`feeName_${i}`));
    if (!feeName) continue;
    const amount = toFloat(formData.get(`feeAmount_${i}`), 0);
    if (!(amount > 0)) {
      return error(`Fee "${feeName}" must have an amount greater than zero`, { [`feeAmount_${i}`]: "Amount must be greater than zero" });
    }
    const classIdxRaw = toStr(formData.get(`feeClassIndex_${i}`));
    const termIdxRaw = toStr(formData.get(`feeTermIndex_${i}`));
    const classIndex = classIdxRaw !== "" && classIdxRaw !== "none" ? Number(classIdxRaw) : null;
    const termIndex = termIdxRaw !== "" && termIdxRaw !== "none" ? Number(termIdxRaw) : null;
    if (classIndex != null && !Number.isFinite(classIndex)) {
      return error(`Invalid class selected for fee "${feeName}"`);
    }
    if (termIndex != null && !Number.isFinite(termIndex)) {
      return error(`Invalid term selected for fee "${feeName}"`);
    }
    fees.push({
      name: feeName,
      category: toStr(formData.get(`feeCategory_${i}`)) || "TUITION",
      amount,
      classIndex,
      termIndex,
    });
  }
  if (fees.length > MAX_FEES) return error(`Too many fee structures (max ${MAX_FEES})`);

  // ---- Persist -----------------------------------------------------------
  const created = await db.$transaction(async (tx) => {
    await tx.school.update({
      where: { id: schoolId },
      data: {
        name,
        motto: toStr(formData.get("motto")) || null,
        address: toStr(formData.get("address")) || null,
        phone: toStr(formData.get("phone")) || null,
        email: toStr(formData.get("email")) || null,
        website: toStr(formData.get("website")) || null,
        registrationNumber: toStr(formData.get("registrationNumber")) || null,
        currency: toStr(formData.get("currency")) || existing.currency,
        currencySymbol: toStr(formData.get("currencySymbol")) || existing.currencySymbol,
        logo,
        primaryColor: toStr(formData.get("primaryColor")) || existing.primaryColor,
        secondaryColor: toStr(formData.get("secondaryColor")) || existing.secondaryColor,
      },
    });

    const year = await tx.academicYear.create({
      data: { schoolId, name: yearName, startDate: yearStart, endDate: yearEnd, isCurrent: true },
    });

    const termIds: string[] = [];
    for (const [idx, term] of terms.entries()) {
      const createdTerm = await tx.term.create({
        data: {
          schoolId,
          academicYearId: year.id,
          name: term.name,
          termNumber: idx + 1,
          startDate: term.start,
          endDate: term.end,
          isCurrent: idx === 0,
        },
      });
      termIds.push(createdTerm.id);
    }

    const classIds: string[] = [];
    for (const cls of classes) {
      const createdClass = await tx.class.create({
        data: { schoolId, name: cls.name, level: cls.level, capacity: cls.capacity },
      });
      classIds.push(createdClass.id);
    }

    const subjectIds: string[] = [];
    for (const subject of subjects) {
      const createdSubject = await tx.subject.create({
        data: {
          schoolId,
          code: subject.code,
          name: subject.name,
          passMark: subject.passMark,
          maxMark: subject.maxMark,
        },
      });
      subjectIds.push(createdSubject.id);
    }

    for (const fee of fees) {
      await tx.feeStructure.create({
        data: {
          schoolId,
          name: fee.name,
          category: fee.category,
          amount: fee.amount,
          classId: fee.classIndex != null ? classIds[fee.classIndex] : null,
          termId: fee.termIndex != null ? termIds[fee.termIndex] : null,
        },
      });
    }

    return { yearId: year.id, classes: classes.length, subjects: subjects.length, fees: fees.length };
  });

  await auditor(session).log({
    action: "SETUP",
    entity: "school",
    entityId: schoolId,
    details: created,
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
}
