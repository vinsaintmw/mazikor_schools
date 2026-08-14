import Link from "next/link";
import { PlusIcon } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults } from "@/lib/format";
import { serialize } from "@/lib/serialize";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { TeachersTable, type TeacherRow } from "@/components/teachers/teachers-table";

export const metadata = { title: "Teachers" };

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);
  const { page, perPage, search, status, skip } = paginationDefaults(await searchParams);

  const include: Prisma.TeacherInclude = { _count: { select: { subjects: true, classTeacher: true } } };

  async function loadMoreTeachers(nextPage: number) {
    "use server";
    const session = await auth();
    if (!session?.user) return [];
    const schoolId = getSchoolId(session);
    const rows = await db.teacher.findMany({
      where: {
        schoolId,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { employeeId: { contains: search, mode: "insensitive" as const } },
                { specialization: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
        ...(status ? { status: status as never } : {}),
      },
      include,
      orderBy: [{ lastName: "asc" }],
      skip: (nextPage - 1) * perPage,
      take: perPage,
    });
    return serialize(rows) as TeacherRow[];
  }

  const where = {
    schoolId,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { employeeId: { contains: search, mode: "insensitive" as const } },
            { specialization: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status ? { status: status as never } : {}),
  };

  const [teachers, total] = await Promise.all([
    db.teacher.findMany({ where, include, orderBy: [{ lastName: "asc" }], skip, take: perPage }),
    db.teacher.count({ where }),
  ]);

  const canCreate = can(session, "teachers.create");

  return (
    <div className="space-y-4">
      <PageHeader title="Teachers" description="Teaching staff and subject assignments">
        {canCreate ? (
          <Button asChild>
            <Link href="/teachers/new">
              <PlusIcon />
              New teacher
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search name, ID or specialisation…" />
        {["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"].map((s) => (
          <Link
            key={s}
            href={`/teachers?status=${s}`}
            className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors ${
              status === s ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"
            }`}
          >
            {s.replace(/_/g, " ").toLowerCase()}
          </Link>
        ))}
      </div>

      {teachers.length ? (
        <TeachersTable
          initialRows={serialize(teachers) as TeacherRow[]}
          total={total}
          perPage={perPage}
          initialPage={page}
          loadMore={loadMoreTeachers}
        />
      ) : (
        <EmptyState
          title="No teachers found"
          description="Add teaching staff to build the academic team."
          action={canCreate ? { label: "Add Teacher", href: "/teachers/new" } : undefined}
          icon={<PlusIcon className="size-6" />}
        />
      )}
    </div>
  );
}
