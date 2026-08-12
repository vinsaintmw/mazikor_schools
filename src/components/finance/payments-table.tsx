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
import { deletePayment } from "@/lib/actions/finance";
import { formatMoney, formatDate } from "@/lib/format";

export type PaymentRow = Prisma.PaymentGetPayload<{
  include: { student: true; invoice: { include: { items: true } } };
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
  const list = useInfiniteList({ initialRows, total, perPage, loadMore, initialPage });

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Receipt</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono text-xs font-medium">{p.receiptNumber}</TableCell>
              <TableCell className="font-medium">
                {p.student.firstName} {p.student.lastName}
              </TableCell>
              <TableCell className="font-mono text-xs">{p.invoice?.number ?? "—"}</TableCell>
              <TableCell className="font-mono font-medium">{formatMoney(p.amount)}</TableCell>
              <TableCell className="capitalize">{p.method.replace(/_/g, " ").toLowerCase()}</TableCell>
              <TableCell>{formatDate(p.date)}</TableCell>
              <TableCell>
                <div className="flex justify-end">
                  {canDelete ? (
                    <DeleteButton
                      action={deletePayment.bind(null, p.id)}
                      confirmTitle="Delete this payment?"
                      label=""
                      confirmDescription="This will remove the payment record."
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
