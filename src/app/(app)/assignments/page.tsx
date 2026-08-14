import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardListIcon, CalendarClockIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { AssignmentFormDialog } from "@/components/assignments/assignment-form";
import { createAssignment, deleteAssignment } from "@/lib/actions/academics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Assignments" };

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session, "assignments.view")) redirect("/dashboard");
  const schoolId = getSchoolId(session);
  const { page, perPage, search, skip } = paginationDefaults(await searchParams);

  const where = {
    schoolId,
    ...(search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [assignments, total, subjects, classes] = await Promise.all([
    db.assignment.findMany({
      where,
      include: {
        subject: true,
        class: true,
        teacher: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: "desc" },
      skip,
      take: perPage,
    }),
    db.assignment.count({ where }),
    db.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
    db.class.findMany({ where: { schoolId }, orderBy: { level: "asc" } }),
  ]);

  const canCreate = can(session, "assignments.create");
  const canDelete = can(session, "assignments.grade") || can(session, "assignments.create");

  return (
    <div className="space-y-4">
      <PageHeader title="Assignments" description="Homework and class assignments">
        {canCreate ? (
          <AssignmentFormDialog
            action={createAssignment}
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
            classes={classes.map((c) => ({ id: c.id, name: c.name }))}
          />
        ) : null}
      </PageHeader>

      <SearchInput placeholder="Search assignments…" />

      {assignments.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => {
                const overdue = new Date(a.dueDate) < new Date();
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Link href={`/assignments/${a.id}`} className="font-medium">
                        {a.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {a.teacher.firstName} {a.teacher.lastName}
                      </p>
                    </TableCell>
                    <TableCell>{a.subject.name}</TableCell>
                    <TableCell>{a.class.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-sm ${overdue ? "text-destructive" : ""}`}>
                        <CalendarClockIcon className="size-3.5" />
                        {formatDate(a.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell>{a._count.submissions}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/assignments/${a.id}`}
                          className="inline-flex h-8 items-center rounded-lg px-2.5 text-sm font-medium transition-colors hover:bg-muted"
                        >
                          View
                        </Link>
                        {canDelete ? (
                          <DeleteButton
                            action={deleteAssignment.bind(null, a.id)}
                            confirmTitle={`Delete ${a.title}?`}
                            label=""
                            confirmDescription="This will remove the assignment and all submissions."
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No assignments found"
          description="Create an assignment to give students work."
          icon={<ClipboardListIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />
    </div>
  );
}
