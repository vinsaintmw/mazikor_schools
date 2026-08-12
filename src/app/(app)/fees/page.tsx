import { TagsIcon } from "lucide-react";
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
import { FeeStructureDialog } from "@/components/finance/fee-structure-dialog";
import { FeesTable, type FeeRow } from "@/components/finance/fees-table";
import { createFeeStructure } from "@/lib/actions/finance";

export const metadata = { title: "Fee structures" };

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);
  const { page, perPage, search, skip } = paginationDefaults(await searchParams);

  const include: Prisma.FeeStructureInclude = { class: true, term: true };

  async function loadMoreFees(nextPage: number) {
    "use server";
    const session = await auth();
    if (!session?.user) return [];
    const schoolId = getSchoolId(session);
    const rows = await db.feeStructure.findMany({
      where: {
        schoolId,
        ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      },
      include,
      orderBy: { category: "asc" },
      skip: (nextPage - 1) * perPage,
      take: perPage,
    });
    return serialize(rows) as FeeRow[];
  }

  const where = {
    schoolId,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [fees, total, classes, terms] = await Promise.all([
    db.feeStructure.findMany({ where, include, orderBy: { category: "asc" }, skip, take: perPage }),
    db.feeStructure.count({ where }),
    db.class.findMany({ where: { schoolId }, orderBy: { level: "asc" } }),
    db.term.findMany({ where: { schoolId }, orderBy: { termNumber: "asc" } }),
  ]);

  const canManage = can(session, "fees.manage");
  const classMap = classes.map((c) => ({ id: c.id, name: c.name }));
  const termMap = terms.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="space-y-4">
      <PageHeader title="Fee structures" description="Configure school fees by class and term">
        {canManage ? (
          <FeeStructureDialog
            action={createFeeStructure}
            classes={classMap}
            terms={termMap}
            mode="create"
          />
        ) : null}
      </PageHeader>

      <SearchInput placeholder="Search fee structures…" />

      {fees.length ? (
        <FeesTable
          initialRows={serialize(fees) as FeeRow[]}
          total={total}
          perPage={perPage}
          initialPage={page}
          loadMore={loadMoreFees}
          canManage={canManage}
          classes={classMap}
          terms={termMap}
        />
      ) : (
        <EmptyState
          title="No fee structures found"
          description="Add fee structures to generate invoices."
          action={canManage ? { label: "New fee structure", href: "/fees" } : undefined}
          icon={<TagsIcon className="size-6" />}
        />
      )}
    </div>
  );
}
