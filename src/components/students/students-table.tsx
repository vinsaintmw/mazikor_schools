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
import { fullName, initials } from "@/lib/format";

export type StudentRow = Prisma.StudentGetPayload<{
  include: { stream: { include: { class: true } } };
}>;

export function StudentsTable({
  initialRows,
  total,
  perPage,
  loadMore,
  initialPage,
}: {
  initialRows: StudentRow[];
  total: number;
  perPage: number;
  loadMore: (page: number) => Promise<StudentRow[]>;
  initialPage?: number;
}) {
  const list = useInfiniteList({ initialRows, total, perPage, loadMore, initialPage });

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Admission No.</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.rows.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <Link href={`/students/${s.id}`} className="flex items-center gap-2.5">
                  <Avatar className="size-8">
                    <AvatarFallback>{initials(fullName(s.firstName, s.middleName, s.lastName))}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{fullName(s.firstName, s.middleName, s.lastName)}</span>
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs">{s.admissionNumber}</TableCell>
              <TableCell>{s.stream?.name ?? "—"}</TableCell>
              <TableCell className="capitalize">{s.gender.toLowerCase()}</TableCell>
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
