import { db, ctx, rand, randInt, chance } from "./helpers";

export async function seedAttendance() {
  const dates: Date[] = [];
  const d = new Date();
  d.setDate(d.getDate() - 40);
  const today = new Date();
  while (d <= today) {
    if (d.getDay() >= 1 && d.getDay() <= 5) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  let count = 0;
  for (const date of dates) {
    const records = ctx.students.map((st) => {
      const r = rand();
      let status: "PRESENT" | "EXCUSED" | "ABSENT" | "LATE" = "PRESENT";
      if (r > 0.97) status = "EXCUSED";
      else if (r > 0.92) status = "ABSENT";
      else if (r > 0.85) status = "LATE";
      count++;
      return {
        schoolId: ctx.school.id,
        studentId: st.id,
        classId: ctx.classes[st.className].id,
        streamId: st.streamId,
        date,
        status,
        markedById: ctx.teacherIds[randInt(0, ctx.teacherIds.length - 1)],
      };
    });
    await db.attendance.createMany({ data: records, skipDuplicates: true });
  }
  console.log(`✓ ${count} attendance records`);
}

export async function seedExams() {
  const examDefs = [
    { name: `End of Term 1 Examinations ${ctx.year}`, type: "END_OF_TERM", term: "Term 1", start: `${ctx.year}-03-25`, end: `${ctx.year}-04-05` },
    { name: `Mid-Year Examinations ${ctx.year}`, type: "MID_TERM", term: "Term 2", start: `${ctx.year}-06-22`, end: `${ctx.year}-07-02` },
  ];
  const formSubjects: Record<number, string[]> = {
    1: ["ENG", "CHI", "MTH", "SOC", "AGR", "LSC", "RST", "CMP"],
    2: ["ENG", "CHI", "MTH", "SOC", "AGR", "LSC", "RST", "CMP"],
    3: ["ENG", "CHI", "MTH", "BIO", "PSC", "HIS", "GEO", "AGR", "CMP", "BUS", "ACC", "FRN"],
    4: ["ENG", "CHI", "MTH", "BIO", "PSC", "HIS", "GEO", "AGR", "CMP", "BUS", "ACC", "FRN"],
  };
  const bands = await db.gradeBand.findMany({ where: { gradeScaleId: ctx.gradeScale.id }, orderBy: { min: "desc" } });

  for (const ed of examDefs) {
    const exam = await db.exam.create({
      data: {
        schoolId: ctx.school.id,
        name: ed.name,
        type: ed.type as never,
        academicYearId: ctx.academicYear.id,
        termId: ctx.terms[ed.term],
        gradeScaleId: ctx.gradeScale.id,
        startDate: new Date(ed.start),
        endDate: new Date(ed.end),
        isPublished: true,
      },
    });

    for (const [className, cls] of Object.entries(ctx.classes)) {
      const level = Number(className.split(" ")[1]);
      const codes = formSubjects[level];
      for (const code of codes) {
        const examSubject = await db.examSubject.create({
          data: {
            schoolId: ctx.school.id,
            examId: exam.id,
            subjectId: ctx.subjects[code],
            classId: cls.id,
            date: new Date(`${ed.start}`),
            maxMark: 100,
            passMark: 40,
          },
        });
        const classStudents = ctx.students.filter((s) => s.className === className);
        const ability = new Map<string, number>();
        for (const st of classStudents) ability.set(st.id, randInt(30, 95));
        for (const st of classStudents) {
          const raw = Math.min(100, Math.max(3, ability.get(st.id)! + randInt(-12, 12)));
          const band = bands.find((b) => raw >= b.min.toNumber() && raw <= b.max.toNumber());
          await db.result.create({
            data: {
              schoolId: ctx.school.id,
              examId: exam.id,
              examSubjectId: examSubject.id,
              studentId: st.id,
              rawMark: raw,
              percentage: raw,
              grade: band?.grade ?? "F",
              points: band?.points ?? 6,
              enteredById: ctx.teacherIds[randInt(0, ctx.teacherIds.length - 1)],
            },
          });
        }
      }
    }
  }
  console.log("✓ exams + results");
}

export async function computePositions() {
  const exams = await db.exam.findMany({ where: { schoolId: ctx.school.id }, select: { id: true } });
  for (const { id: examId } of exams) {
    const results = await db.result.findMany({ where: { examId }, include: { examSubject: true } });
    const byClass = new Map<string, Map<string, { sum: number; count: number }>>();
    for (const r of results) {
      const clsId = r.examSubject.classId;
      let m = byClass.get(clsId);
      if (!m) {
        m = new Map();
        byClass.set(clsId, m);
      }
      const cur = m.get(r.studentId) ?? { sum: 0, count: 0 };
      cur.sum += r.percentage.toNumber();
      cur.count += 1;
      m.set(r.studentId, cur);
    }
    for (const [clsId, m] of byClass) {
      const ranked = [...m.entries()]
        .map(([studentId, v]) => ({ studentId, avg: v.sum / v.count }))
        .sort((a, b) => b.avg - a.avg);
      for (let i = 0; i < ranked.length; i++) {
        const upd = await db.result.findFirst({
          where: { examId, examSubject: { classId: clsId }, studentId: ranked[i].studentId },
          select: { id: true },
        });
        if (upd) {
          await db.result.update({ where: { id: upd.id }, data: { position: i + 1 } });
        }
      }
    }
  }
  console.log("✓ positions computed");
}
