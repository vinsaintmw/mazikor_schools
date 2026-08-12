import Link from "next/link";
import { PlusIcon } from "lucide-react";
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
import { ParentsTable, type ParentRow } from "@/components/parents/parents-table";

export const metadata = { title: "Parents" };

export default async function ParentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);
  const { page, perPage, search, skip } = paginationDefaults(await searchParams);

  async function loadMoreParents(nextPage: number) {
    "use server";
    const session = await auth();
    if (!session?.user) return [];
    const schoolId = getSchoolId(session);
    const rows = await db.parent.findMany({
      where: {
        schoolId,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      include: { students: { include: { student: true } } },
      orderBy: [{ lastName: "asc" }],
      skip: (nextPage - 1) * perPage,
      take: perPage,
    });
    return serialize(rows) as ParentRow[];
  }

  const where = {
    schoolId,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

  const [parents, total] = await Promise.all([
    db.parent.findMany({
      where,
      include: { students: { include: { student: true } } },
      orderBy: [{ lastName: "asc" }],
      skip,
      take: perPage,
    }),
    db.parent.count({ where }),
  ]);

  const canCreate = can(session, "parents.create");

  return (
    <div className="space-y-4">
      <PageHeader title="Parents" description="Parent and guardian contact records">
        {canCreate ? (
          <Button asChild>
            <Link href="/parents/new">
              <PlusIcon />
              New parent
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <SearchInput placeholder="Search name or phone…" />

      {parents.length ? (
        <ParentsTable
          initialRows={serialize(parents) as ParentRow[]}
          total={total}
          perPage={perPage}
          initialPage={page}
          loadMore={loadMoreParents}
        />
      ) : (
        <EmptyState
          title="No parents found"
          description="Add parent details to link them with students."
          action={canCreate ? { label: "New parent", href: "/parents/new" } : undefined}
          icon={<PlusIcon className="size-6" />}
        />
      )}
    </div>
  );
}
