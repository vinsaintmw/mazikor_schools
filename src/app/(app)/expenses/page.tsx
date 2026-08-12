import Link from "next/link";
import { ReceiptIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults, formatMoney } from "@/lib/format";
import { serialize } from "@/lib/serialize";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { EmptyState } from "@/components/empty-state";
import { ExpenseDialog } from "@/components/finance/expense-dialog";
import { ExpensesTable, type ExpenseRow } from "@/components/finance/expenses-table";
import { createExpense } from "@/lib/actions/finance";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);
  const sp = await searchParams;
  const { page, perPage, search, skip } = paginationDefaults(sp);
  const category = Array.isArray(sp.category) ? sp.category[0] : sp.category ?? "";

  async function loadMoreExpenses(nextPage: number) {
    "use server";
    const session = await auth();
    if (!session?.user) return [];
    const schoolId = getSchoolId(session);
    const rows = await db.expense.findMany({
      where: {
        schoolId,
        ...(category ? { category: category as never } : {}),
        ...(search ? { description: { contains: search, mode: "insensitive" as const } } : {}),
      },
      orderBy: { date: "desc" },
      skip: (nextPage - 1) * perPage,
      take: perPage,
    });
    return serialize(rows) as ExpenseRow[];
  }

  const where = {
    schoolId,
    ...(category ? { category: category as never } : {}),
    ...(search ? { description: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [expenses, total, aggregate] = await Promise.all([
    db.expense.findMany({ where, orderBy: { date: "desc" }, skip, take: perPage }),
    db.expense.count({ where }),
    db.expense.aggregate({ where: { schoolId }, _sum: { amount: true } }),
  ]);

  const canManage = can(session, "expenses.manage");

  return (
    <div className="space-y-4">
      <PageHeader title="Expenses" description={`Total spending: ${formatMoney(aggregate._sum.amount ?? 0)}`}>
        {canManage ? <ExpenseDialog action={createExpense} /> : null}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search expenses…" />
        {EXPENSE_CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/expenses?category=${c.value}`}
            className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors ${
              category === c.value ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {expenses.length ? (
        <ExpensesTable
          initialRows={serialize(expenses) as ExpenseRow[]}
          total={total}
          perPage={perPage}
          initialPage={page}
          loadMore={loadMoreExpenses}
          canManage={canManage}
        />
      ) : (
        <EmptyState
          title="No expenses found"
          description="Record an expense to track school spending."
          action={canManage ? { label: "New expense", href: "/expenses" } : undefined}
          icon={<ReceiptIcon className="size-6" />}
        />
      )}
    </div>
  );
}
