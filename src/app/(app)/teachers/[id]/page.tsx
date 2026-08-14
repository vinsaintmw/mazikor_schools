import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PencilIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { fullName, formatDate, formatMoney, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initials } from "@/lib/format";
import { DeleteButton } from "@/components/delete-button";
import { deleteTeacher } from "@/lib/actions/people";
import { SetBreadcrumbLabel } from "@/components/layout/set-breadcrumb-label";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teacher profile",
};

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);

  const { id } = await params;
  const teacher = await db.teacher.findFirst({
    where: { id, schoolId },
    include: {
      subjects: { include: { subject: true, class: true } },
      classTeacher: { include: { streams: true } },
      timetables: { include: { subject: true, class: true, stream: true } },
    },
  });
  if (!teacher) notFound();

  const name = fullName(teacher.firstName, teacher.lastName);
  const canEdit = can(session, "teachers.edit");
  const canDelete = can(session, "teachers.delete");

  return (
    <div className="space-y-6">
      <SetBreadcrumbLabel path={`/teachers/${teacher.id}`} label={name} />
      <PageHeader
        title={name}
        description={`${teacher.employeeId} · ${teacher.specialization ?? "General"} · Joined ${formatDate(teacher.joiningDate)}`}
      >
        {canEdit ? (
          <Button asChild variant="outline">
            <Link href={`/teachers/${teacher.id}/edit`}>
              <PencilIcon />
              Edit
            </Link>
          </Button>
        ) : null}
        {canDelete ? (
          <DeleteButton
            action={deleteTeacher.bind(null, teacher.id)}
            confirmTitle="Delete this teacher?"
            redirectTo="/teachers"
          />
        ) : null}
      </PageHeader>

      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <StatusBadge status={teacher.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Subjects" value={formatNumber(teacher.subjects.length)} />
        <MiniStat label="Class teacher of" value={formatNumber(teacher.classTeacher.length)} />
        <MiniStat label="Timetable slots" value={formatNumber(teacher.timetables.length)} />
        <MiniStat label="Salary" value={formatMoney(Number(teacher.salary ?? 0))} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Info label="Gender" value={teacher.gender.toLowerCase()} />
            <Info label="Date of birth" value={formatDate(teacher.dateOfBirth)} />
            <Info label="Phone" value={teacher.phone} />
            <Info label="Email" value={teacher.email} />
            <Info label="Address" value={teacher.address} />
            <Info label="Qualification" value={teacher.qualification} />
            <Info label="Employment" value={teacher.employmentType.replace(/_/g, " ").toLowerCase()} />
            <Info label="Salary" value={formatMoney(Number(teacher.salary ?? 0))} />
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Subject assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.subjects.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {teacher.subjects.map((a) => (
                    <div key={a.id} className="rounded-lg border px-3 py-2">
                      <p className="text-sm font-medium">{a.subject.name}</p>
                      <p className="text-xs text-muted-foreground">{a.class.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No subject assignments.</p>
              )}
            </CardContent>
          </Card>

          {teacher.classTeacher.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Class teacher</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {teacher.classTeacher.map((c) => (
                  <span key={c.id} className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                    {c.name}
                  </span>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.timetables.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {teacher.timetables
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.period - b.period)
                    .map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">
                            {t.subject.name} · {t.stream?.name ?? t.class.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Day {t.dayOfWeek}, period {t.period} ({t.startTime}–{t.endTime})
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No timetable entries.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
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
