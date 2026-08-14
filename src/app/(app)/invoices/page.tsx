import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon, ScrollTextIcon } from "lucide-react";
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
import { InvoicesTable, type InvoiceRow } from "@/components/finance/invoices-table";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (!can(session, "invoices.view")) redirect("/dashboard");
  const schoolId = getSchoolId(session);
  const sp = await searchParams;
  const { page, perPage, search, skip } = paginationDefaults(sp);
  const status = Array.isArray(sp.status) ? sp.status[0] : sp.status ?? "";

  const select: Prisma.InvoiceSelect = {
    id: true,
    number: true,
    status: true,
    discount: true,
    dueDate: true,
    studentId: true,
    student: { select: { firstName: true, middleName: true, lastName: true } },
    items: { select: { amount: true } },
    payments: { select: { amount: true } },
  };

  async function loadMoreInvoices(nextPage: number) {
    "use server";
    const session = await auth();
    if (!session?.user) return [];
    if (!can(session, "invoices.view")) return [];
    const schoolId = getSchoolId(session);
    const rows = await db.invoice.findMany({
      where: {
        schoolId,
        ...(status ? { status: status as never } : {}),
        ...(search
          ? {
              OR: [
                { number: { contains: search, mode: "insensitive" as const } },
                { student: { OR: [{ firstName: { contains: search, mode: "insensitive" as const } }, { lastName: { contains: search, mode: "insensitive" as const } }] } },
              ],
            }
          : {}),
      },
      select,
      orderBy: { createdAt: "desc" },
      skip: (nextPage - 1) * perPage,
      take: perPage,
    });
    return serialize(rows) as InvoiceRow[];
  }

  const where = {
    schoolId,
    ...(status ? { status: status as never } : {}),
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: "insensitive" as const } },
            { student: { OR: [{ firstName: { contains: search, mode: "insensitive" as const } }, { lastName: { contains: search, mode: "insensitive" as const } }] } },
          ],
        }
      : {}),
  };

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({ where, select, orderBy: { createdAt: "desc" }, skip, take: perPage }),
    db.invoice.count({ where }),
  ]);

  const canCreate = can(session, "invoices.create");
  const canDelete = can(session, "invoices.create");

  return (
    <div className="space-y-4">
      <PageHeader title="Invoices" description="Student billing and payment tracking">
        {canCreate ? (
          <Button asChild>
            <Link href="/invoices/new">
              <PlusIcon />
              New invoice
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search invoice or student…" />
        {["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE"].map((s) => (
          <Link
            key={s}
            href={`/invoices?status=${s}`}
            className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors ${
              status === s ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"
            }`}
          >
            {s.replace(/_/g, " ").toLowerCase()}
          </Link>
        ))}
      </div>

      {invoices.length ? (
        <InvoicesTable
          initialRows={serialize(invoices) as InvoiceRow[]}
          total={total}
          perPage={perPage}
          initialPage={page}
          loadMore={loadMoreInvoices}
          canDelete={canDelete}
        />
      ) : (
        <EmptyState
          title="No invoices found"
          description="Create an invoice to bill a student."
          action={canCreate ? { label: "New invoice", href: "/invoices/new" } : undefined}
          icon={<ScrollTextIcon className="size-6" />}
        />
      )}
    </div>
  );
}
