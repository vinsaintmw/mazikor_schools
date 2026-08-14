import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon, ClipboardPenIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { fullName, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { ActionForm } from "@/components/action-form";
import { MarksInput } from "@/components/marks-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { saveMarks } from "@/lib/actions/academics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Enter marks" };

export default async function MarksPage({
  params,
}: {
  params: Promise<{ id: string; examSubjectId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session, "results.enter")) redirect("/exams");
  const schoolId = getSchoolId(session);

  const { id, examSubjectId } = await params;
  const exam = await db.exam.findFirst({ where: { id, schoolId } });
  if (!exam) notFound();

  const examSubject = await db.examSubject.findFirst({
    where: { id: examSubjectId, examId: id, schoolId },
    include: { subject: true, class: true },
  });
  if (!examSubject) notFound();

  const [enrollments, existing, scale] = await Promise.all([
    db.enrollment.findMany({
      where: { classId: examSubject.classId },
      include: { student: true },
      orderBy: { student: { lastName: "asc" } },
    }),
    db.result.findMany({ where: { examSubjectId } }),
    db.exam.findUnique({
      where: { id },
      select: { gradeScale: { include: { bands: true } } },
    }),
  ]);

  const existingByStudent = new Map(existing.map((r) => [r.studentId, r]));
  const maxMark = Number(examSubject.maxMark) || 100;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={`${examSubject.subject.name} — ${examSubject.class?.name ?? ""}`}
        description={`${exam.name} · Max ${examSubject.maxMark} · Pass ${examSubject.passMark} · ${examSubject.date ? formatDate(examSubject.date) : "date TBD"}`}
      >
        <Button asChild variant="outline">
          <Link href={`/exams/${exam.id}`}>
            <ArrowLeftIcon />
            Back to exam
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardPenIcon className="size-4" />
            Student marks
          </CardTitle>
          <CardDescription>
            {scale?.gradeScale?.name ? `Grading: ${scale.gradeScale.name}` : "Default grading will be applied."}{" "}
            Leave a mark blank to skip that student.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length ? (
            <ActionForm action={saveMarks.bind(null, examSubjectId)} className="space-y-4" successLabel="Marks saved">
              <div className="rounded-lg border">
                <Table className="table-cards">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="w-28">Mark / {maxMark}</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead className="w-32">Current</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((e) => {
                      const ex = existingByStudent.get(e.studentId);
                      return (
                        <TableRow key={e.studentId}>
                          <TableCell data-label="Student" data-span="full">
                            <span className="font-medium">
                              {fullName(e.student.firstName, e.student.middleName, e.student.lastName)}
                            </span>
                            <span className="ml-2 font-mono text-xs text-muted-foreground">{e.student.admissionNumber}</span>
                          </TableCell>
                          <TableCell data-label={`Mark / ${maxMark}`}>
                            <MarksInput
                              name={`mark_${e.studentId}`}
                              min={0}
                              max={maxMark}
                              step="0.5"
                              defaultValue={ex ? Number(ex.rawMark) : ""}
                              placeholder="—"
                            />
                          </TableCell>
                          <TableCell data-label="Comment">
                            <input
                              name={`comment_${e.studentId}`}
                              defaultValue={ex?.comment ?? ""}
                              placeholder="Optional comment"
                              className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8 sm:text-sm dark:bg-input/30"
                            />
                          </TableCell>
                          <TableCell data-label="Current">
                            {ex ? (
                              <span className="text-sm font-medium">
                                {ex.grade ?? ""} {ex.grade ? "· " : ""}
                                {Number(ex.percentage)}%
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end">
                <SubmitButton>Save marks</SubmitButton>
              </div>
            </ActionForm>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No students enrolled in {examSubject.class?.name ?? "this class"}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
