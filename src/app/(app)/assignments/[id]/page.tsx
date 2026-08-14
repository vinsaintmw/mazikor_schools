import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon, CalendarClockIcon, FileTextIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { fullName, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { GradeForm } from "@/components/assignments/grade-form";

export const metadata = { title: "Assignment details" };

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session, "assignments.view")) redirect("/dashboard");
  const schoolId = getSchoolId(session);

  const { id } = await params;
  const assignment = await db.assignment.findFirst({
    where: { id, schoolId },
    include: {
      subject: true,
      class: true,
      teacher: true,
      submissions: {
        include: { student: true },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!assignment) notFound();

  const canGrade = can(session, "assignments.grade");

  return (
    <div className="space-y-6">
      <PageHeader title={assignment.title} description={`${assignment.subject.name} · ${assignment.class.name}`}>
        <Button asChild variant="outline">
          <Link href="/assignments">
            <ArrowLeftIcon />
            All assignments
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subject</span>
              <span className="font-medium">{assignment.subject.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Class</span>
              <span className="font-medium">{assignment.class.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teacher</span>
              <span className="font-medium">
                {assignment.teacher.firstName} {assignment.teacher.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due date</span>
              <span className="inline-flex items-center gap-1 font-medium">
                <CalendarClockIcon className="size-3.5" />
                {formatDate(assignment.dueDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submissions</span>
              <span className="font-medium">{assignment.submissions.length}</span>
            </div>
            {assignment.description ? (
              <p className="pt-2 text-muted-foreground">{assignment.description}</p>
            ) : null}
            {assignment.instructions ? (
              <div className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                  <FileTextIcon className="size-3.5" />
                  Instructions
                </p>
                <p className="whitespace-pre-line">{assignment.instructions}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Submissions</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {assignment.submissions.length ? (
              <div className="space-y-3">
                {assignment.submissions.map((s) => (
                  <div key={s.id} className="rounded-lg border px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {fullName(s.student.firstName, s.student.middleName, s.student.lastName)}
                          <span className="ml-2 font-mono text-xs text-muted-foreground">{s.student.admissionNumber}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Submitted {formatDate(s.submittedAt)}</p>
                      </div>
                      {s.grade != null ? <StatusBadge status="APPROVED">Graded</StatusBadge> : null}
                    </div>
                    {s.content ? <p className="mt-2 text-sm text-muted-foreground">{s.content}</p> : null}
                    {canGrade ? (
                      <div className="mt-3">
                        <GradeForm
                          submissionId={s.id}
                          grade={s.grade != null ? Number(s.grade) : null}
                          feedback={s.feedback}
                        />
                      </div>
                    ) : null}
                    {s.feedback && !canGrade ? (
                      <p className="mt-2 text-xs text-muted-foreground">Feedback: {s.feedback}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No submissions yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
