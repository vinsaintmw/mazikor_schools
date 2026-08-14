import Link from "next/link";
import { redirect } from "next/navigation";
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
import { StaffTable, type StaffRow } from "@/components/staff/staff-table";

export const metadata = { title: "Staff" };

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (!can(session, "staff.view")) redirect("/dashboard");
  const schoolId = getSchoolId(session);
  const { page, perPage, search, status, skip } = paginationDefaults(await searchParams);

  async function loadMoreStaff(nextPage: number) {
    "use server";
    const session = await auth();
    if (!session?.user) return [];
    if (!can(session, "staff.view")) return [];
    const schoolId = getSchoolId(session);
    const rows = await db.staff.findMany({
      where: {
        schoolId,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { employeeId: { contains: search, mode: "insensitive" as const } },
                { position: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
        ...(status ? { status: status as never } : {}),
      },
      orderBy: [{ lastName: "asc" }],
      skip: (nextPage - 1) * perPage,
      take: perPage,
    });
    return serialize(rows) as StaffRow[];
  }

  const where = {
    schoolId,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { employeeId: { contains: search, mode: "insensitive" as const } },
            { position: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status ? { status: status as never } : {}),
  };

  const [staff, total] = await Promise.all([
    db.staff.findMany({ where, orderBy: [{ lastName: "asc" }], skip, take: perPage }),
    db.staff.count({ where }),
  ]);

  const canCreate = can(session, "staff.create");

  return (
    <div className="space-y-4">
      <PageHeader title="Staff" description="Non-teaching staff members">
        {canCreate ? (
          <Button asChild>
            <Link href="/staff/new">
              <PlusIcon />
              New staff
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search name, ID or position…" />
        {["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"].map((s) => (
          <Link
            key={s}
            href={`/staff?status=${s}`}
            className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors ${
              status === s ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"
            }`}
          >
            {s.replace(/_/g, " ").toLowerCase()}
          </Link>
        ))}
      </div>

      {staff.length ? (
        <StaffTable
          initialRows={serialize(staff) as StaffRow[]}
          total={total}
          perPage={perPage}
          initialPage={page}
          loadMore={loadMoreStaff}
        />
      ) : (
        <EmptyState
          title="No staff found"
          description="Add non-teaching staff members."
          action={canCreate ? { label: "New staff", href: "/staff/new" } : undefined}
          icon={<PlusIcon className="size-6" />}
        />
      )}
    </div>
  );
}
