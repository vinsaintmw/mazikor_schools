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
import { DeleteButton } from "@/components/delete-button";
import { formatMoney, formatDate } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export type PaymentRow = Prisma.PaymentGetPayload<{
  select: {
    id: true;
    receiptNumber: true;
    amount: true;
    method: true;
    date: true;
    student: { select: { firstName: true; lastName: true } };
    invoice: { select: { number: true; status: true } };
  };
}>;

export function PaymentsTable({
  initialRows,
  total,
  perPage,
  loadMore,
  initialPage,
  canDelete,
}: {
  initialRows: PaymentRow[];
  total: number;
  perPage: number;
  loadMore: (page: number) => Promise<PaymentRow[]>;
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
        row.receiptNumber
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        row.student.firstName
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (!statusFilter || row.invoice.status === statusFilter)
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
            placeholder="Search payments..."
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring sm:w-64 sm:text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:text-sm"
          >
            <option value="">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
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
              <TableHead>Receipt</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const payment = initialRows.find((p) => p.id === row.id);
              if (!payment) return null;
              return (
                <TableRow key={payment.id}>
                  <TableCell data-label="Receipt" className="font-mono text-xs font-medium">
                    {payment.receiptNumber}
                  </TableCell>
                  <TableCell data-label="Student" data-span="full" className="font-medium">
                    {payment.student.firstName} {payment.student.lastName}
                  </TableCell>
                  <TableCell data-label="Invoice" className="font-mono text-xs">
                    {payment.invoice?.number ?? "—"}
                  </TableCell>
                  <TableCell data-label="Amount" className="text-right font-mono font-medium">
                    {formatMoney(payment.amount)}
                  </TableCell>
                  <TableCell data-label="Method" className="capitalize">
                    {payment.method.replace(/_/g, " ").toLowerCase()}
                  </TableCell>
                  <TableCell data-label="Date">{formatDate(payment.date)}</TableCell>
                  <TableCell data-span="full" className="text-right">
                    <div className="flex justify-end">
                      {canDelete ? (
                        <DeleteButton
                          action={async () => {}}
                          confirmTitle="Delete this payment?"
                          label=""
                          confirmDescription="This will remove the payment record."
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