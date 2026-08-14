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
import { initials, formatDate } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DeleteButton } from "@/components/delete-button";
import type { Prisma } from "@prisma/client";

export type TeacherRow = Prisma.TeacherGetPayload<{
  include: { _count: { select: { subjects: true; classTeacher: true } } };
}>;

export function TeachersTable({
  initialRows,
  total,
  perPage,
  loadMore,
  initialPage,
}: {
  initialRows: TeacherRow[];
  total: number;
  perPage: number;
  loadMore: (page: number) => Promise<TeacherRow[]>;
  initialPage?: number;
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
            placeholder="Search teachers..."
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
            <option value="RESIGNED">Resigned</option>
            <option value="SUSPENDED">Suspended</option>
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
              <TableHead>Teacher</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Specialisation</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const teacher = initialRows.find((t) => t.id === row.id);
              if (!teacher) return null;
              return (
                <TableRow key={teacher.id}>
                  <TableCell data-label="Teacher" data-span="full">
                    <Link href={`/teachers/${teacher.id}`} className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback>
                          {initials(`${teacher.firstName} ${teacher.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {teacher.firstName} {teacher.lastName}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell data-label="Employee ID" className="font-mono text-xs">
                    {teacher.employeeId}
                  </TableCell>
                  <TableCell data-label="Specialisation">{teacher.specialization ?? "—"}</TableCell>
                  <TableCell data-label="Subjects">{teacher._count.subjects}</TableCell>
                  <TableCell data-label="Joined">{formatDate(teacher.joiningDate)}</TableCell>
                  <TableCell data-label="Status">
                    <StatusBadge status={teacher.status} />
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