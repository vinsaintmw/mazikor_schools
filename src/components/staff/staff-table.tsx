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
import type { Staff } from "@prisma/client";

export type StaffRow = Staff;

export function StaffTable({
  initialRows,
  total,
  perPage,
  loadMore,
  initialPage,
  canDelete,
}: {
  initialRows: StaffRow[];
  total: number;
  perPage: number;
  loadMore: (page: number) => Promise<StaffRow[]>;
  initialPage?: number;
  canDelete?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [columnOrder, setColumnOrder] = useState<Record<string, "asc" | "desc">>({});

  const start = Math.min(1, total);
  const end = Math.min((initialPage ?? 1) * perPage, total);

  const filteredRows = initialRows.filter(
    row =>
      (!search ||
        `${row.firstName} ${row.lastName}`
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
            placeholder="Search staff..."
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring sm:w-64 sm:text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:text-sm"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
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
              <TableHead>Name</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const staff = initialRows.find((s) => s.id === row.id);
              if (!staff) return null;
              return (
                <TableRow key={staff.id}>
                  <TableCell data-label="Name" data-span="full">
                    <Link href={`/staff/${staff.id}`} className="flex items-center gap-2.5">
                      <span className="font-medium">
                        {staff.firstName} {staff.lastName}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell data-label="Employee ID" className="font-mono text-xs">
                    {staff.employeeId}
                  </TableCell>
                  <TableCell data-label="Position">{staff.position ?? "—"}</TableCell>
                  <TableCell data-label="Department">{staff.department ?? "—"}</TableCell>
                  <TableCell data-label="Phone">{staff.phone ?? "—"}</TableCell>
                  <TableCell data-label="Status">
                    <StatusBadge status={staff.status} />
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