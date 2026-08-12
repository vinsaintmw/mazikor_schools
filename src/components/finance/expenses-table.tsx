"use client";

import type { Prisma } from "@prisma/client";
import {
  useInfiniteList,
  InfiniteListFooter,
} from "@/components/infinite-list";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import { deleteExpense } from "@/lib/actions/finance";
import { formatMoney, formatDate } from "@/lib/format";
import { getLabel, EXPENSE_CATEGORIES } from "@/lib/constants";

export type ExpenseRow = Prisma.ExpenseGetPayload<Record<string, never>>;

export function ExpensesTable({
  initialRows,
  total,
  perPage,
  loadMore,
  initialPage,
  canManage,
}: {
  initialRows: ExpenseRow[];
  total: number;
  perPage: number;
  loadMore: (page: number) => Promise<ExpenseRow[]>;
  initialPage?: number;
  canManage: boolean;
}) {
  const list = useInfiniteList({ initialRows, total, perPage, loadMore, initialPage });

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.rows.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-mono text-xs">{e.number}</TableCell>
              <TableCell className="font-medium">{e.description}</TableCell>
              <TableCell>{getLabel(e.category, EXPENSE_CATEGORIES)}</TableCell>
              <TableCell>{e.vendor ?? "—"}</TableCell>
              <TableCell className="font-mono">{formatMoney(e.amount)}</TableCell>
              <TableCell>{formatDate(e.date)}</TableCell>
              <TableCell>
                <div className="flex justify-end">
                  {canManage ? (
                    <DeleteButton
                      action={deleteExpense.bind(null, e.id)}
                      confirmTitle="Delete this expense?"
                      label=""
                      confirmDescription="This will remove the expense record."
                    />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <InfiniteListFooter
        loading={list.loading}
        error={list.error}
        hasMore={list.hasMore}
        loadNext={list.loadNext}
        total={total}
        loaded={list.rows.length}
        perPage={perPage}
      />
    </div>
  );
}
