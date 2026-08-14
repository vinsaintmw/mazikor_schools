import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PencilIcon, PlusIcon, XIcon, CheckIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { fullName, formatNumber } from "@/lib/format";import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { ActionForm } from "@/components/action-form";
import { TextInput, NativeSelect } from "@/components/forms";
import { DeleteButton } from "@/components/delete-button";
import {
  deleteClass,
  createStream,
  deleteStream,
  toggleClassSubject,
  assignSubjectTeacher,
  unassignSubjectTeacher,
} from "@/lib/actions/academics";
import { SetBreadcrumbLabel } from "@/components/layout/set-breadcrumb-label";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Class details",
};

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session, "classes.view")) redirect("/dashboard");
  const schoolId = getSchoolId(session);

  const { id } = await params;
  const cls = await db.class.findFirst({
    where: { id, schoolId },
    include: {
      streams: {
        include: {
          students: { where: { status: "ACTIVE" }, orderBy: [{ lastName: "asc" }] },
        },
      },
      subjects: { include: { subject: true }, orderBy: { subject: { name: "asc" } } },
      subjectTeachers: { include: { teacher: true, subject: true } },
      classTeacher: true,
      enrollments: {
        include: { student: true, stream: true },
        where: { status: "ACTIVE" },
        orderBy: { student: { lastName: "asc" } },
      },
    },
  });
  if (!cls) notFound();

  const canEdit = can(session, "classes.edit");
  const canDelete = can(session, "classes.delete");

  const allSubjects = canEdit
    ? await db.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" } })
    : [];
  const teachers = canEdit
    ? await db.teacher.findMany({ where: { schoolId, status: "ACTIVE" }, orderBy: [{ lastName: "asc" }] })
    : [];

  const subjectIds = new Set(cls.subjects.map((cs) => cs.subjectId));

  return (
    <div className="space-y-6">
      <SetBreadcrumbLabel path={`/classes/${cls.id}`} label={cls.name} />
      <PageHeader title={`${cls.name}`} description={`Level ${cls.level} · Room ${cls.room ?? "—"}`}>
        {canEdit ? (
          <Button asChild variant="outline">
            <Link href={`/classes/${cls.id}/edit`}>
              <PencilIcon />
              Edit
            </Link>
          </Button>
        ) : null}
        {canDelete ? (
          <DeleteButton
            action={deleteClass.bind(null, cls.id)}
            confirmTitle="Delete this class?"
            redirectTo="/classes"
          />
        ) : null}
      </PageHeader>

      {cls.classTeacher ? (
        <p className="text-sm text-muted-foreground">
          Class teacher:{" "}
          <span className="font-medium text-foreground">
            {cls.classTeacher.firstName} {cls.classTeacher.lastName}
          </span>
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Active students" value={formatNumber(cls.enrollments.length)} />
        <MiniStat label="Streams" value={formatNumber(cls.streams.length)} />
        <MiniStat label="Subjects offered" value={formatNumber(cls.subjects.length)} />
        <MiniStat label="Subject teachers" value={formatNumber(cls.subjectTeachers.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between">
                <span>Streams</span>
                <span className="text-sm font-normal text-muted-foreground">{formatNumber(cls.streams.length)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {cls.streams.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(s.students.length)} active students</p>
                    </div>
                    {canEdit ? (
                      <form
                        action={async () => {
                          await deleteStream(s.id);
                        }}
                      >
                        <Button type="submit" variant="ghost" size="icon-sm" aria-label={`Delete stream ${s.name}`}>
                          <XIcon />
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ))}
                {!cls.streams.length ? (
                  <p className="py-2 text-center text-sm text-muted-foreground">No streams yet.</p>
                ) : null}
              </div>

              {canEdit ? (
                <ActionForm action={createStream} className="mt-4 space-y-2" successLabel="Stream added">
                  <input type="hidden" name="classId" value={cls.id} />
                  <TextInput name="name" label="Add stream" placeholder="e.g. Form 1C" required />
                  <div className="flex justify-end">
                    <SubmitButton size="sm">
                      <PlusIcon />
                      Add stream
                    </SubmitButton>
                  </div>
                </ActionForm>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {cls.enrollments.length ? (
                <div className="max-h-96 space-y-1 overflow-y-auto">
                  {cls.enrollments.map((e) => (
                    <Link
                      key={e.id}
                      href={`/students/${e.student.id}`}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
                    >
                      <span>{fullName(e.student.firstName, e.student.middleName, e.student.lastName)}</span>
                      <span className="font-mono text-xs text-muted-foreground">{e.student.admissionNumber}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No students enrolled.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Subjects</CardTitle>
              <CardDescription>
                {formatNumber(cls.subjects.length)} subjects offered
              </CardDescription>
            </CardHeader>            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {cls.subjects.map((cs) => (
                  <span key={cs.id} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium">
                    <CheckIcon className="size-3.5 text-emerald-600" />
                    {cs.subject.name}
                    {canEdit ? (
                      <form
                        action={async (formData: FormData) => {
                          await toggleClassSubject(cls.id, formData);
                        }}
                      >
                        <input type="hidden" name="subjectId" value={cs.subjectId} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${cs.subject.name}`}
                        >
                          <XIcon />
                        </Button>
                      </form>
                    ) : null}
                  </span>
                ))}
              </div>

              {canEdit ? (
                <form
                  action={async (formData: FormData) => {
                    await toggleClassSubject(cls.id, formData);
                  }}
                  className="mt-4 flex gap-2"
                >
                  <NativeSelect
                    name="subjectId"
                    options={allSubjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
                    placeholder="Add a subject…"
                    className="flex-1"
                  />
                  <SubmitButton size="sm">
                    <PlusIcon />
                    Add
                  </SubmitButton>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Subject teachers</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {cls.subjectTeachers.length ? (
                <div className="space-y-2">
                  {cls.subjectTeachers.map((st) => (
                    <div key={st.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{st.subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {st.teacher.firstName} {st.teacher.lastName}
                        </p>
                      </div>
                      {canEdit ? (
                        <form
                          action={async () => {
                            await unassignSubjectTeacher(st.id);
                          }}
                        >
                          <Button type="submit" variant="ghost" size="icon-sm" aria-label="Unassign teacher">
                            <XIcon />
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-center text-sm text-muted-foreground">No teachers assigned to subjects.</p>
              )}

              {canEdit ? (
                <ActionForm action={assignSubjectTeacher} className="mt-4 grid gap-2 sm:grid-cols-3" successLabel="Teacher assigned">
                  <input type="hidden" name="classId" value={cls.id} />
                  <NativeSelect
                    name="teacherId"
                    options={teachers.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))}
                    placeholder="Teacher"
                    className="sm:col-span-1"
                  />
                  <NativeSelect
                    name="subjectId"
                    options={allSubjects.map((s) => ({ value: s.id, label: s.name }))}
                    placeholder="Subject"
                    className="sm:col-span-1"
                  />
                  <SubmitButton size="sm">
                    <PlusIcon />
                    Assign
                  </SubmitButton>
                </ActionForm>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
