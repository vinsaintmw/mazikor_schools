import { redirect } from "next/navigation";
import { FileSpreadsheetIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { fullName, formatDate } from "@/lib/format";
import { getLabel, EXAM_TYPES } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { NativeSelect } from "@/components/forms";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ReportCardPdf } from "@/components/report-cards/report-card-pdf";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Report cards" };

export default async function ReportCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  const sp = await searchParams;
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]);
  const examId = get("exam") ?? "";
  const studentId = get("student") ?? "";

  const [exams, students] = await Promise.all([
    db.exam.findMany({ where: { schoolId }, orderBy: { startDate: "desc" }, take: 100 }),
    db.student.findMany({
      where: { schoolId, status: "ACTIVE" },
      include: { stream: true },
      orderBy: [{ lastName: "asc" }],
      take: 500,
    }),
  ]);

  const exam = examId
    ? await db.exam.findFirst({ where: { id: examId, schoolId }, include: { term: true, academicYear: true } })
    : null;
  const student = studentId
    ? await db.student.findFirst({ where: { id: studentId, schoolId }, include: { stream: true } })
    : null;

  const rows =
    exam && student
      ? await db.result.findMany({
          where: { examId, studentId: student.id },
          include: { examSubject: { include: { subject: true } } },
          orderBy: { examSubject: { subject: { name: "asc" } } },
        })
      : [];

  const reportRows = rows.map((r) => ({
    subject: r.examSubject.subject.name,
    mark: Number(r.rawMark),
    maxMark: Number(r.examSubject.maxMark),
    percentage: Number(r.percentage),
    grade: r.grade,
    points: Number(r.points),
  }));
  const average =
    reportRows.length > 0
      ? reportRows.reduce((s, r) => s + r.percentage, 0) / reportRows.length
      : 0;
  const totalPoints = reportRows.reduce((s, r) => s + r.points, 0);
  const position = rows[0]?.position ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="Report cards" description="Generate and download student report cards" />

      <form className="grid gap-3 sm:grid-cols-2">
        <NativeSelect
          name="exam"
          label="Examination"
          defaultValue={examId || null}
          options={exams.map((e) => ({ value: e.id, label: `${e.name} · ${formatDate(e.startDate)}` }))}
          placeholder="Select an exam"
        />
        <NativeSelect
          name="student"
          label="Student"
          defaultValue={studentId || null}
          options={students.map((s) => ({
            value: s.id,
            label: `${fullName(s.firstName, s.middleName, s.lastName)} (${s.admissionNumber})`,
          }))}
          placeholder="Select a student"
        />
      </form>

      {exam && student ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {fullName(student.firstName, student.middleName, student.lastName)}
                <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">{student.admissionNumber}</span>
              </span>
              <ReportCardPdf
                studentName={fullName(student.firstName, student.middleName, student.lastName)}
                admissionNumber={student.admissionNumber}
                className={student.stream?.name ?? "—"}
                examName={exam.name}
                examType={getLabel(exam.type, EXAM_TYPES)}
                termName={exam.term?.name ?? ""}
                rows={reportRows}
                average={average}
                totalPoints={totalPoints}
                position={position}
                schoolName={session.user.schoolName ?? "Mazikor Schools"}
              />
            </CardTitle>
            <CardDescription>
              {exam.name} · {exam.term?.name ?? ""} · {exam.academicYear?.name ?? ""} · Class{" "}
              {student.stream?.name ?? "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {reportRows.length ? (
              <>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Mark</TableHead>
                        <TableHead>Max</TableHead>
                        <TableHead>%</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportRows.map((r) => (
                        <TableRow key={r.subject}>
                          <TableCell className="font-medium">{r.subject}</TableCell>
                          <TableCell className="font-mono">{r.mark}</TableCell>
                          <TableCell className="font-mono">{r.maxMark}</TableCell>
                          <TableCell className="font-mono">{r.percentage}%</TableCell>
                          <TableCell className="font-semibold">{r.grade ?? "—"}</TableCell>
                          <TableCell className="font-mono">{r.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-lg border bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Average</p>
                    <p className="text-lg font-semibold">{average.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Total points</p>
                    <p className="text-lg font-semibold">{totalPoints}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Position</p>
                    <p className="text-lg font-semibold">{position ? `#${position}` : "—"}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No results found for this student in the selected exam.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="Select an exam and student"
          description="Choose an examination and a student to view and download a report card."
          icon={<FileSpreadsheetIcon className="size-6" />}
        />
      )}
    </div>
  );
}
