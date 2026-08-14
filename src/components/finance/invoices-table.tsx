"use client";

import Link from "next/link";
import { useState } from "react";
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
  TableCaption,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatMoney, formatDate, fullName } from "@/lib/format";
import { DeleteButton } from "@/components/delete-button";
import type { Prisma } from "@prisma/client";

export type InvoiceRow = Prisma.InvoiceGetPayload<{
  select: {
    id: true;
    number: true;
    status: true;
    discount: true;
    dueDate: true;
    studentId: true;
    student: { select: { firstName: true; middleName: true; lastName: true } };
    items: { select: { amount: true } };
    payments: { select: { amount: true } };
  };
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [columnOrder, setColumnOrder] = useState<Record<string, "asc" | "desc">>({});

  const start = Math.min(1, total);
  const end = Math.min((initialPage ?? 1) * perPage, total);

  const filteredRows = initialRows.filter(
    row =>
      (!search ||
        row.number
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        fullName(row.student.firstName, row.student.middleName, row.student.lastName)
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (!statusFilter || row.status === statusFilter)
  );

  const tableReact = {
    getCoreRowModel: () => ({
      rows: filteredRows.map((row, i) => ({
        id: row.id,
        rowIndex: i,
      })),
    }),
    getFilteredRowModel: () => ({
      rows: filteredRows,
    }),
    getSortedRowModel: () => ({
      rows: filteredRows,
    }),
  };

  const rows = tableReact.getCoreRowModel().rows;

  const getTotal = (inv: InvoiceRow) =>
    inv.items.reduce((s, i) => s + Number(i.amount), 0) - Number(inv.discount);
  const getPaid = (inv: InvoiceRow) =>
    inv.payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col gap-2 border-b px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{start}–{end}</span> of{" "}
          <span className="font-medium text-foreground">{total}</span>
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring sm:w-64 sm:text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:text-sm"
          >
            <option value="">All statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table className="table-cards">
          <TableCaption>
            Showing {start}–{end} of {total}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const inv = initialRows.find((i) => i.id === row.id);
              if (!inv) return null;
              const total = inv.items.reduce((s, i) => s + Number(i.amount), 0) - Number(inv.discount);
              const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
              return (
                <TableRow key={inv.id}>
                  <TableCell data-label="Invoice" data-span="full">
                    <Link href={`/invoices/${inv.id}`} className="font-mono text-xs font-medium">
                      {inv.number}
                    </Link>
                  </TableCell>
                  <TableCell data-label="Student">
                    <Link href={`/students/${inv.studentId}`} className="font-medium">
                      {fullName(inv.student.firstName, inv.student.middleName, inv.student.lastName)}
                    </Link>
                  </TableCell>
                  <TableCell data-label="Total" className="text-right font-mono">
                    {formatMoney(total)}
                  </TableCell>
                  <TableCell data-label="Paid" className="text-right font-mono">
                    {formatMoney(paid)}
                  </TableCell>
                  <TableCell data-label="Due date">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</TableCell>
                  <TableCell data-label="Status">
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell data-span="full" className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex h-9 items-center rounded-lg px-2.5 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        View
                      </Link>
                      {canDelete ? (
                        <DeleteButton
                          action={async () => {}}
                          confirmTitle={`Delete ${inv.number}?`}
                          label=""
                          confirmDescription="This will remove the invoice and its items."
                          className="text-destructive hover:text-destructive"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <InfiniteListFooter
        loading={false}
        error={false}
        hasMore={false}
        loadNext={async () => {}}
        total={total}
        loaded={rows.length}
        perPage={perPage}
      />
    </div>
  );
}