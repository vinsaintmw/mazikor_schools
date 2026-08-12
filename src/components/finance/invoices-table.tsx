"use client";

import type { Prisma } from "@prisma/client";
import Link from "next/link";
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
import { StatusBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { deleteInvoice } from "@/lib/actions/finance";
import { formatMoney, formatDate, fullName } from "@/lib/format";

export type InvoiceRow = Prisma.InvoiceGetPayload<{
  include: { student: true; items: true; payments: true };
}>;

export function InvoicesTable({
  initialRows,
  total,
  perPage,
  loadMore,
  initialPage,
  canDelete,
}: {
  initialRows: InvoiceRow[];
  total: number;
  perPage: number;
  loadMore: (page: number) => Promise<InvoiceRow[]>;
  initialPage?: number;
  canDelete: boolean;
}) {
  const list = useInfiniteList({ initialRows, total, perPage, loadMore, initialPage });

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.rows.map((inv) => {
            const total = inv.items.reduce((s, i) => s + Number(i.amount), 0) - Number(inv.discount);
            const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
            return (
              <TableRow key={inv.id}>
                <TableCell>
                  <Link href={`/invoices/${inv.id}`} className="font-mono text-xs font-medium">
                    {inv.number}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/students/${inv.studentId}`} className="font-medium">
                    {fullName(inv.student.firstName, inv.student.middleName, inv.student.lastName)}
                  </Link>
                </TableCell>
                <TableCell className="font-mono">{formatMoney(total)}</TableCell>
                <TableCell className="font-mono">{formatMoney(paid)}</TableCell>
                <TableCell>{inv.dueDate ? formatDate(inv.dueDate) : "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={inv.status} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="inline-flex h-8 items-center rounded-lg px-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      View
                    </Link>
                    {canDelete ? (
                      <DeleteButton
                        action={deleteInvoice.bind(null, inv.id)}
                        confirmTitle={`Delete ${inv.number}?`}
                        label=""
                        confirmDescription="This will remove the invoice and its items."
                      />
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
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
