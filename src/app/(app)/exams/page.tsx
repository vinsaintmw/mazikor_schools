import Link from "next/link";
import { PlusIcon, FileTextIcon, ExternalLinkIcon, CheckIcon, EyeOffIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults, formatDate } from "@/lib/format";
import { getLabel, EXAM_TYPES } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { publishExam, deleteExam } from "@/lib/actions/academics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Examinations" };

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);
  const sp = await searchParams;
  const { page, perPage, search, skip } = paginationDefaults(sp);
  const type = Array.isArray(sp.type) ? sp.type[0] : sp.type ?? "";

  const where = {
    schoolId,
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
    ...(type ? { type: type as never } : {}),
  };

  const [exams, total] = await Promise.all([
    db.exam.findMany({
      where,
      include: {
        term: true,
        academicYear: true,
        _count: { select: { subjects: true, results: true } },
      },
      orderBy: { startDate: "desc" },
      skip,
      take: perPage,
    }),
    db.exam.count({ where }),
  ]);

  const canEdit = can(session, "exams.edit");
  const canDelete = can(session, "exams.delete");
  const canPublish = can(session, "exams.publish");
  const canCreate = can(session, "exams.create");

  return (
    <div className="space-y-4">
      <PageHeader title="Examinations" description="Plan exams, enter marks and publish results">
        {canCreate ? (
          <Button asChild>
            <Link href="/exams/new">
              <PlusIcon />
              New exam
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search exams…" />
        {EXAM_TYPES.map((t) => (
          <Link
            key={t}
            href={`/exams?type=${t}`}
            className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors ${
              type === t ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"
            }`}
          >
            {getLabel(t, EXAM_TYPES)}
          </Link>
        ))}
        {type ? (
          <Link
            href="/exams"
            className="inline-flex h-8 items-center rounded-lg border border-input bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            All
          </Link>
        ) : null}
      </div>

      {exams.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Link href={`/exams/${e.id}`} className="flex items-center gap-2 font-medium">
                      <FileTextIcon className="size-4 text-muted-foreground" />
                      {e.name}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{getLabel(e.type, EXAM_TYPES)}</TableCell>
                  <TableCell>{e.term?.name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(e.startDate)} → {formatDate(e.endDate)}
                  </TableCell>
                  <TableCell>{e._count.subjects}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.isPublished ? "PUBLISHED" : "DRAFT"} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon-sm" aria-label={`Open ${e.name}`}>
                        <Link href={`/exams/${e.id}`}>
                          <ExternalLinkIcon />
                        </Link>
                      </Button>
                      {canPublish ? (
                        <form action={publishExam.bind(null, e.id, !e.isPublished)}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={e.isPublished ? "Unpublish results" : "Publish results"}
                            title={e.isPublished ? "Unpublish results" : "Publish results"}
                          >
                            {e.isPublished ? <EyeOffIcon /> : <CheckIcon />}
                          </Button>
                        </form>
                      ) : null}
                      {canDelete ? (
                        <DeleteButton
                          action={deleteExam.bind(null, e.id)}
                          confirmTitle={`Delete ${e.name}?`}
                          confirmDescription="This will remove the exam and all entered marks."
                          label=""
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No exams found"
          description="Create your first exam to start recording marks."
          action={canCreate ? { label: "New exam", href: "/exams/new" } : undefined}
          icon={<FileTextIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />
    </div>
  );
}
