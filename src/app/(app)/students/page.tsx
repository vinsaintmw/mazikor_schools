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
import { StudentsTable, type StudentRow } from "@/components/students/students-table";

export const metadata = { title: "Students" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);
  const sp = await searchParams;
  const { page, perPage, search, status, skip } = paginationDefaults(sp);

  const where = {
    schoolId,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { admissionNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status ? { status: status as never } : {}),
  };

  const include: Prisma.StudentInclude = { stream: { include: { class: true } } };

  async function loadMoreStudents(nextPage: number) {
    "use server";
    const session = await auth();
    if (!session?.user) return [];
    const schoolId = getSchoolId(session);
    const rows = await db.student.findMany({
      where: {
        schoolId,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { admissionNumber: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
        ...(status ? { status: status as never } : {}),
      },
      include,
      orderBy: { admissionNumber: "asc" },
      skip: (nextPage - 1) * perPage,
      take: perPage,
    });
    return serialize(rows) as StudentRow[];
  }

  const [students, total] = await Promise.all([
    db.student.findMany({ where, include, orderBy: { admissionNumber: "asc" }, skip, take: perPage }),
    db.student.count({ where }),
  ]);

  const canCreate = can(session, "students.create");

  return (
    <div className="space-y-4">
      <PageHeader title="Students" description="Manage all student records">
        {canCreate ? (
          <Button asChild>
            <Link href="/students/new">
              <PlusIcon />
              New student
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search name or admission number…" />
        <Link
          href="/students"
          className="inline-flex h-8 items-center rounded-lg border border-input bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          All
        </Link>
        {["ACTIVE", "GRADUATED", "TRANSFERRED", "SUSPENDED", "WITHDRAWN"].map((s) => (
          <Link
            key={s}
            href={`/students?status=${s}`}
            className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors ${
              status === s ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"
            }`}
          >
            {s.replace(/_/g, " ").toLowerCase()}
          </Link>
        ))}
      </div>

      {students.length ? (
        <StudentsTable
          initialRows={serialize(students) as StudentRow[]}
          total={total}
          perPage={perPage}
          initialPage={page}
          loadMore={loadMoreStudents}
        />
      ) : (
        <EmptyState
          title="No students found"
          description="Add your first student to get started."
          action={canCreate ? { label: "New student", href: "/students/new" } : undefined}
          icon={<PlusIcon className="size-6" />}
        />
      )}
    </div>
  );
}
