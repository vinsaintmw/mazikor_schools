import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PencilIcon, PlusIcon, XIcon, CheckIcon, EyeOffIcon, ClipboardPenIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { formatDate, formatNumber } from "@/lib/format";
import { getLabel, EXAM_TYPES } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { ActionForm } from "@/components/action-form";
import { TextInput, NativeSelect } from "@/components/forms";
import { StatusBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { addExamSubject, removeExamSubject, publishExam, deleteExam } from "@/lib/actions/academics";
import { SetBreadcrumbLabel } from "@/components/layout/set-breadcrumb-label";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exam details",
};

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);

  const { id } = await params;
  const exam = await db.exam.findFirst({
    where: { id, schoolId },
    include: {
      term: { include: { academicYear: true } },
      gradeScale: true,
      subjects: {
        include: { subject: true, class: true, _count: { select: { results: true } } },
        orderBy: { subject: { name: "asc" } },
      },
      _count: { select: { results: true } },
    },
  });
  if (!exam) notFound();

  const canEdit = can(session, "exams.edit");
  const canDelete = can(session, "exams.delete");
  const canPublish = can(session, "exams.publish");
  const canEnterMarks = can(session, "results.enter");

  const [subjects, classes] = await Promise.all([
    db.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
    db.class.findMany({ where: { schoolId }, orderBy: { level: "asc" } }),
  ]);

  const existingKeys = new Set(exam.subjects.map((s) => `${s.subjectId}|${s.classId}`));

  return (
    <div className="space-y-6">
      <SetBreadcrumbLabel path={`/exams/${exam.id}`} label={exam.name} />
      <PageHeader
        title={exam.name}
        description={`${getLabel(exam.type, EXAM_TYPES)} · ${exam.term?.name ?? "—"} · ${exam.term?.academicYear?.name ?? ""}`}
      >
        {canPublish ? (
          <form
            action={async () => {
              await publishExam(exam.id, !exam.isPublished);
            }}
          >
            <Button type="submit" variant={exam.isPublished ? "outline" : "default"}>
              {exam.isPublished ? <EyeOffIcon /> : <CheckIcon />}
              {exam.isPublished ? "Unpublish" : "Publish results"}
            </Button>
          </form>
        ) : null}
        {canEdit ? (
          <Button asChild variant="outline">
            <Link href={`/exams/${exam.id}/edit`}>
              <PencilIcon />
              Edit
            </Link>
          </Button>
        ) : null}
        {canDelete ? (
          <DeleteButton
            action={deleteExam.bind(null, exam.id)}
            confirmTitle="Delete this exam?"
            confirmDescription="This will remove the exam and all entered marks."
            redirectTo="/exams"
          />
        ) : null}
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dates</span>
              <span>
                {formatDate(exam.startDate)} → {formatDate(exam.endDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={exam.isPublished ? "PUBLISHED" : "DRAFT"} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Grading</span>
              <span>{exam.gradeScale?.name ?? "Default"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subjects</span>
              <span>{formatNumber(exam.subjects.length)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Marks entered</span>
              <span>{formatNumber(exam._count.results)}</span>
            </div>
            {exam.description ? (
              <p className="pt-2 text-muted-foreground">{exam.description}</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {canEdit ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Add exam subject</CardTitle>
                <CardDescription>Choose the subject, class and paper details.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ActionForm action={addExamSubject} className="grid gap-3 sm:grid-cols-2" successLabel="Subject added">
                  <input type="hidden" name="examId" value={exam.id} />
                  <NativeSelect
                    name="subjectId"
                    label="Subject"
                    required
                    options={subjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
                    placeholder="Select subject"
                  />
                  <NativeSelect
                    name="classId"
                    label="Class"
                    required
                    options={classes.map((c) => ({ value: c.id, label: c.name }))}
                    placeholder="Select class"
                  />
                  <TextInput name="date" label="Exam date" type="date" />
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
                    <TextInput name="maxMark" label="Max" type="number" min={1} defaultValue={100} />
                    <TextInput name="passMark" label="Pass" type="number" min={0} defaultValue={40} />
                    <TextInput name="weight" label="Weight" type="number" min={1} defaultValue={1} />
                  </div>
                  <div className="flex items-end justify-end sm:col-span-2">
                    <SubmitButton size="sm">
                      <PlusIcon />
                      Add subject
                    </SubmitButton>
                  </div>
                </ActionForm>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Exam papers</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {exam.subjects.length ? (
                <div className="space-y-2">
                  {exam.subjects.map((es) => (
                    <div key={es.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {es.subject.name}
                          <span className="ml-2 text-xs text-muted-foreground">· {es.class?.name ?? "—"}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Max {formatNumber(es.maxMark)} · Pass {formatNumber(es.passMark)} · {es.date ? formatDate(es.date) : "date TBD"} · {es._count.results} marks
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {canEnterMarks ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/exams/${exam.id}/marks/${es.id}`}>
                              <ClipboardPenIcon />
                              Enter marks
                            </Link>
                          </Button>
                        ) : null}
                        {canEdit ? (
                          <form
                            action={async () => {
                              await removeExamSubject(es.id);
                            }}
                          >
                            <Button type="submit" variant="ghost" size="icon-sm" aria-label="Remove paper">
                              <XIcon />
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {canEnterMarks && existingKeys.size > 0 ? (
                    <p className="pt-2 text-xs text-muted-foreground">
                      Tip: click “Enter marks” on a paper to record student marks.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No papers added yet. Add subjects above to start entering marks.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
