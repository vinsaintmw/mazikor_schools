import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getSchoolId } from "@/lib/server-helpers";
import { can } from "@/lib/permissions";

type SearchResult = {
  type: "student" | "parent" | "teacher" | "class";
  id: string;
  label: string;
  sub: string;
  href: string;
};

const TAKE = 5;

function nameFilter(q: string) {
  return {
    OR: [
      { firstName: { contains: q, mode: "insensitive" as const } },
      { lastName: { contains: q, mode: "insensitive" as const } },
    ],
  };
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const schoolId = getSchoolId(session);
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ results: [] });

  const results: SearchResult[] = [];

  if (can(session, "students.view")) {
    const students = await db.student.findMany({
      where: {
        schoolId,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { admissionNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      take: TAKE,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        stream: { select: { name: true, class: { select: { name: true } } } },
      },
    });
    results.push(
      ...students.map((s) => ({
        type: "student" as const,
        id: s.id,
        label: `${s.firstName} ${s.lastName}`,
        sub: [s.admissionNumber, s.stream ? `${s.stream.class.name} ${s.stream.name}` : null]
          .filter(Boolean)
          .join(" · "),
        href: `/students/${s.id}`,
      }))
    );
  }

  if (can(session, "parents.view")) {
    const parents = await db.parent.findMany({
      where: { schoolId, ...nameFilter(q) },
      take: TAKE,
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    });
    results.push(
      ...parents.map((p) => ({
        type: "parent" as const,
        id: p.id,
        label: `${p.firstName} ${p.lastName}`,
        sub: [p.phone, p.email].filter(Boolean).join(" · "),
        href: `/parents/${p.id}`,
      }))
    );
  }

  if (can(session, "teachers.view")) {
    const teachers = await db.teacher.findMany({
      where: { schoolId, ...nameFilter(q) },
      take: TAKE,
      select: { id: true, firstName: true, lastName: true, employeeId: true },
    });
    results.push(
      ...teachers.map((t) => ({
        type: "teacher" as const,
        id: t.id,
        label: `${t.firstName} ${t.lastName}`,
        sub: t.employeeId ?? "",
        href: `/teachers/${t.id}`,
      }))
    );
  }

  if (can(session, "classes.view")) {
    const classes = await db.class.findMany({
      where: { schoolId, name: { contains: q, mode: "insensitive" } },
      take: TAKE,
      select: { id: true, name: true, level: true },
    });
    results.push(
      ...classes.map((c) => ({
        type: "class" as const,
        id: c.id,
        label: `${c.name}`,
        sub: c.level ? `${c.level} · Class` : "Class",
        href: `/classes/${c.id}`,
      }))
    );
  }

  return NextResponse.json({ results });
}
