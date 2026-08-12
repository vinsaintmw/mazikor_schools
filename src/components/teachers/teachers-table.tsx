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
import { initials, formatDate } from "@/lib/format";

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
  const list = useInfiniteList({ initialRows, total, perPage, loadMore, initialPage });

  return (
    <div className="rounded-xl border bg-card">
      <Table>
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
          {list.rows.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link href={`/teachers/${t.id}`} className="flex items-center gap-2.5">
                  <Avatar className="size-8">
                    <AvatarFallback>{initials(`${t.firstName} ${t.lastName}`)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {t.firstName} {t.lastName}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs">{t.employeeId}</TableCell>
              <TableCell>{t.specialization ?? "—"}</TableCell>
              <TableCell>{t._count.subjects}</TableCell>
              <TableCell>{formatDate(t.joiningDate)}</TableCell>
              <TableCell>
                <StatusBadge status={t.status} />
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
