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
import { StatusBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { FeeStructureDialog } from "@/components/finance/fee-structure-dialog";
import { updateFeeStructure, deleteFeeStructure } from "@/lib/actions/finance";
import { formatMoney } from "@/lib/format";

export type FeeRow = Prisma.FeeStructureGetPayload<{
  include: { class: true; term: true };
}>;

export function FeesTable({
  initialRows,
  total,
  perPage,
  loadMore,
  initialPage,
  canManage,
  classes,
  terms,
}: {
  initialRows: FeeRow[];
  total: number;
  perPage: number;
  loadMore: (page: number) => Promise<FeeRow[]>;
  initialPage?: number;
  canManage: boolean;
  classes: { id: string; name: string }[];
  terms: { id: string; name: string }[];
}) {
  const list = useInfiniteList({ initialRows, total, perPage, loadMore, initialPage });

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.rows.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-medium">{f.name}</TableCell>
              <TableCell>{f.category}</TableCell>
              <TableCell className="font-mono">{formatMoney(f.amount)}</TableCell>
              <TableCell>{f.class?.name ?? "All classes"}</TableCell>
              <TableCell>{f.term?.name ?? "All terms"}</TableCell>
              <TableCell>
                <StatusBadge status={f.isActive ? "ACTIVE" : "WITHDRAWN"} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {canManage ? (
                    <FeeStructureDialog
                      action={updateFeeStructure.bind(null, f.id)}
                      classes={classes}
                      terms={terms}
                      mode="edit"
                      fee={{
                        id: f.id,
                        name: f.name,
                        category: f.category,
                        amount: Number(f.amount),
                        classId: f.classId,
                        termId: f.termId,
                        isRequired: f.isRequired,
                        isActive: f.isActive,
                      }}
                    />
                  ) : null}
                  {canManage ? (
                    <DeleteButton
                      action={deleteFeeStructure.bind(null, f.id)}
                      confirmTitle={`Delete ${f.name}?`}
                      label=""
                      confirmDescription="This will remove the fee structure from the school."
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
