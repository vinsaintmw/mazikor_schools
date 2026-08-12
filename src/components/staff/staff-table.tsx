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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { initials } from "@/lib/format";

export type StaffRow = Prisma.StaffGetPayload<Record<string, never>>;

export function StaffTable({
  initialRows,
  total,
  perPage,
  loadMore,
  initialPage,
}: {
  initialRows: StaffRow[];
  total: number;
  perPage: number;
  loadMore: (page: number) => Promise<StaffRow[]>;
  initialPage?: number;
}) {
  const list = useInfiniteList({ initialRows, total, perPage, loadMore, initialPage });

  return (
    <div className="rounded-xl border bg-card">
      <Table>
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
          {list.rows.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <Link href={`/staff/${s.id}/edit`} className="flex items-center gap-2.5">
                  <Avatar className="size-8">
                    <AvatarFallback>{initials(`${s.firstName} ${s.lastName}`)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {s.firstName} {s.lastName}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs">{s.employeeId}</TableCell>
              <TableCell>{s.position ?? "—"}</TableCell>
              <TableCell>{s.department ?? "—"}</TableCell>
              <TableCell>{s.phone ?? "—"}</TableCell>
              <TableCell>
                <StatusBadge status={s.status} />
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
