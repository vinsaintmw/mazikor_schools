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
import { initials } from "@/lib/format";

export type ParentRow = Prisma.ParentGetPayload<{
  include: { students: { include: { student: true } } };
}>;

export function ParentsTable({
  initialRows,
  total,
  perPage,
  loadMore,
  initialPage,
}: {
  initialRows: ParentRow[];
  total: number;
  perPage: number;
  loadMore: (page: number) => Promise<ParentRow[]>;
  initialPage?: number;
}) {
  const list = useInfiniteList({ initialRows, total, perPage, loadMore, initialPage });

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Relationship</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Children</TableHead>
            <TableHead>Emergency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link href={`/parents/${p.id}/edit`} className="flex items-center gap-2.5">
                  <Avatar className="size-8">
                    <AvatarFallback>{initials(`${p.firstName} ${p.lastName}`)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {p.firstName} {p.lastName}
                  </span>
                </Link>
              </TableCell>
              <TableCell>{p.relationship}</TableCell>
              <TableCell>{p.phone}</TableCell>
              <TableCell>{p.email ?? "—"}</TableCell>
              <TableCell>{p.students.length}</TableCell>
              <TableCell>{p.isEmergency ? "Yes" : "—"}</TableCell>
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
