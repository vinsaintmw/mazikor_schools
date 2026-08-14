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
import { DeleteButton } from "@/components/delete-button";
import { fullName } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export type ParentRow = Prisma.ParentGetPayload<{
  select: {
    id: true;
    firstName: true;
    lastName: true;
    email: true;
    phone: true;
    relationship: true;
    isEmergency: true;
    _count: { select: { students: true } };
  };
}>;

export function ParentsTable({
  initialRows,
  total,
  perPage,
  loadMore,
  initialPage,
  canDelete,
}: {
  initialRows: ParentRow[];
  total: number;
  perPage: number;
  loadMore: (page: number) => Promise<ParentRow[]>;
  initialPage?: number;
  canDelete?: boolean;
}) {
  const [search, setSearch] = useState("");

  const [columnOrder, setColumnOrder] = useState<Record<string, "asc" | "desc">>({});

  const start = Math.min(1, total);
  const end = Math.min((initialPage ?? 1) * perPage, total);

  const filteredRows = initialRows.filter(
    row =>
      !search ||
      fullName(row.firstName, undefined, row.lastName)
        .toLowerCase()
        .includes(search.toLowerCase())
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
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search parents..."
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring sm:w-64 sm:text-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <Table className="table-cards">
          <TableCaption>
            Showing {start}–{end} of {total}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Parent/Guardian</TableHead>
              <TableHead>Relationship</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Child Count</TableHead>
              <TableHead>Emergency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const parent = initialRows.find((p) => p.id === row.id);
              if (!parent) return null;
              return (
                <TableRow key={parent.id}>
                  <TableCell data-label="Parent / guardian" data-span="full">
                    <Link href={`/parents/${parent.id}`} className="flex items-center gap-2.5">
                      <span className="font-medium">
                        {fullName(parent.firstName, undefined, parent.lastName)}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell data-label="Relationship">{parent.relationship}</TableCell>
                  <TableCell data-label="Phone">{parent.phone}</TableCell>
                  <TableCell data-label="Email">{parent.email ?? "—"}</TableCell>
                  <TableCell data-label="Children">{parent._count.students}</TableCell>
                  <TableCell data-label="Emergency">
                    <StatusBadge status={parent.isEmergency ? "ACTIVE" : "INACTIVE"} />
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