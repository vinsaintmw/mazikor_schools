import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults } from "@/lib/format";
import { serialize } from "@/lib/serialize";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { EmptyState } from "@/components/empty-state";
import { SubjectFormDialog } from "@/components/subjects/subject-form";
import { SubjectsTable, type SubjectRow } from "@/components/subjects/subjects-table";
import { createSubject } from "@/lib/actions/academics";

export const metadata = { title: "Subjects" };

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);
  const { page, perPage, search, skip } = paginationDefaults(await searchParams);

  const include = {
    department: true,
    _count: { select: { classLinks: true, exams: true } },
  } as const;

  async function loadMoreSubjects(nextPage: number) {
    "use server";
    const session = await auth();
    if (!session?.user) return [];
    const schoolId = getSchoolId(session);
    const rows = await db.subject.findMany({
      where: {
        schoolId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { code: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include,
      orderBy: { name: "asc" },
      skip: (nextPage - 1) * perPage,
      take: perPage,
    });
    return serialize(rows) as SubjectRow[];
  }

  const where = {
    schoolId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [subjects, total, departments] = await Promise.all([
    db.subject.findMany({ where, include, orderBy: { name: "asc" }, skip, take: perPage }),
    db.subject.count({ where }),
    db.department.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
  ]);

  const canEdit = can(session, "subjects.edit");
  const canCreate = can(session, "subjects.create");
  const canDelete = can(session, "subjects.delete");

  return (
    <div className="space-y-4">
      <PageHeader title="Subjects" description="Subjects offered at the school">
        {canCreate ? (
          <SubjectFormDialog
            action={createSubject}
            departments={departments.map((d) => ({ id: d.id, name: d.name }))}
            mode="create"
          />
        ) : null}
      </PageHeader>

      <SearchInput placeholder="Search subject or code…" />

      {subjects.length ? (
        <SubjectsTable
          initialRows={serialize(subjects) as SubjectRow[]}
          total={total}
          perPage={perPage}
          initialPage={page}
          loadMore={loadMoreSubjects}
          departments={departments.map((d) => ({ id: d.id, name: d.name }))}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ) : (
        <EmptyState
          title="No subjects found"
          description="Add subjects to start building class timetables and exams."
          action={canCreate ? { label: "New subject", href: "/subjects" } : undefined}
        />
      )}
    </div>
  );
}
