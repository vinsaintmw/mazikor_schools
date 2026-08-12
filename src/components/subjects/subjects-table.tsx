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
import { Badge } from "@/components/ui/badge";
import { SubjectFormDialog } from "@/components/subjects/subject-form";
import { DeleteButton } from "@/components/delete-button";
import { updateSubject, deleteSubject } from "@/lib/actions/academics";

export type SubjectRow = Prisma.SubjectGetPayload<{
  include: { department: true; _count: { select: { classLinks: true; exams: true } } };
}>;

export function SubjectsTable({
  initialRows,
  total,
  perPage,
  loadMore,
  initialPage,
  departments,
  canEdit,
  canDelete,
}: {
  initialRows: SubjectRow[];
  total: number;
  perPage: number;
  loadMore: (page: number) => Promise<SubjectRow[]>;
  initialPage?: number;
  departments: { id: string; name: string }[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const list = useInfiniteList({ initialRows, total, perPage, loadMore, initialPage });

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Pass mark</TableHead>
            <TableHead>Classes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.rows.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <Badge variant="outline" className="font-mono">
                  {s.code}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.department?.name ?? "—"}</TableCell>
              <TableCell>{Number(s.passMark)}%</TableCell>
              <TableCell>{s._count.classLinks}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {canEdit ? (
                    <SubjectFormDialog
                      action={updateSubject.bind(null, s.id)}
                      departments={departments}
                      mode="edit"
                      subject={{
                        id: s.id,
                        code: s.code,
                        name: s.name,
                        description: s.description,
                        departmentId: s.departmentId,
                        passMark: Number(s.passMark),
                        maxMark: Number(s.maxMark),
                      }}
                    />
                  ) : null}
                  {canDelete ? (
                    <DeleteButton
                      action={deleteSubject.bind(null, s.id)}
                      confirmTitle={`Delete ${s.name}?`}
                      label=""
                      confirmDescription="This will remove the subject from the school."
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
