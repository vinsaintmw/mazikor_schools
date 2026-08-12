import Link from "next/link";
import { redirect } from "next/navigation";
import { AwardIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults, fullName, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { NativeSelect } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Results" };

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  const sp = await searchParams;
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]);
  const { page, perPage, search, skip } = paginationDefaults(sp);
  const examId = get("exam") ?? "";
  const examFilter = examId ? { examId } : {};

  const exams = await db.exam.findMany({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    take: 100,
  });

  const where = {
    schoolId,
    ...examFilter,
    ...(search
      ? {
          student: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { admissionNumber: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const [results, total] = await Promise.all([
    db.result.findMany({
      where,
      include: {
        student: { select: { firstName: true, middleName: true, lastName: true, admissionNumber: true } },
        examSubject: { include: { subject: true, class: true } },
      },
      orderBy: [{ position: "asc" }, { student: { lastName: "asc" } }],
      skip,
      take: perPage,
    }),
    db.result.count({ where }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Results" description="View marks, grades and rankings by examination" />

      <form className="flex flex-wrap items-end gap-2">
        <NativeSelect
          name="exam"
          label="Examination"
          defaultValue={examId || null}
          options={exams.map((e) => ({ value: e.id, label: `${e.name} · ${formatDate(e.startDate)}` }))}
          placeholder="All examinations"
          className="w-72"
        />
        {examId ? (
          <Link
            href="/results"
            className="inline-flex h-8 items-center rounded-lg border border-input bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Clear
          </Link>
        ) : null}
        <div className="flex-1">
          <SearchInput placeholder="Search student…" />
        </div>
      </form>

      {results.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Mark</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/students/${r.studentId}`} className="font-medium">
                      {fullName(r.student.firstName, r.student.middleName, r.student.lastName)}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{r.student.admissionNumber}</span>
                  </TableCell>
                  <TableCell>{r.examSubject.class?.name ?? "—"}</TableCell>
                  <TableCell>{r.examSubject.subject.name}</TableCell>
                  <TableCell className="font-mono">{Number(r.rawMark)}</TableCell>
                  <TableCell className="font-mono">{Number(r.percentage)}%</TableCell>
                  <TableCell>
                    <Badge variant={Number(r.percentage) >= 50 ? "default" : "destructive"}>{r.grade ?? "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.position ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium">
                        <AwardIcon className="size-3.5 text-muted-foreground" />
                        #{r.position}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No results found"
          description="Results appear once marks have been entered for an exam."
          icon={<AwardIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />
    </div>
  );
}
