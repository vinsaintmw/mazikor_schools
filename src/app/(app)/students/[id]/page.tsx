import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PencilIcon, Link2Icon, UnlinkIcon, FileIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { fullName, formatDate, formatMoney, formatNumber, initials } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { ActionForm } from "@/components/action-form";
import { NativeSelect, TextAreaField, TextInput } from "@/components/forms";
import { toast } from "sonner";
import { DeleteButton } from "@/components/delete-button";
import { ProfileTabs, type ProfileTab } from "@/components/profile-tabs";
import { SetBreadcrumbLabel } from "@/components/layout/set-breadcrumb-label";
import { deleteStudent, linkParent, unlinkParent, addStudentNote } from "@/lib/actions/people";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student profile",
};

const TAB_ORDER = ["overview", "academic", "attendance", "fees", "parents", "documents", "notes"] as const;
type Tab = (typeof TAB_ORDER)[number];

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);

  const { id } = await params;
  const student = await db.student.findFirst({
    where: { id, schoolId },
    include: {
      stream: { include: { class: true } },
      parents: { include: { parent: true } },
      enrollments: { include: { class: true, term: true } },
      invoices: {
        include: { items: true, payments: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      results: {
        include: { exam: true, examSubject: { include: { subject: true } } },
        orderBy: { updatedAt: "desc" },
        take: 12,
      },
      notes: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });
  if (!student) notFound();

  const canEdit = can(session, "students.edit");
  const canDelete = can(session, "students.delete");
  const canLinkParents = can(session, "parents.edit");
  const canViewFinance = can(session, "invoices.view");
  const canViewResults = can(session, "results.view");
  const canViewAttendance = can(session, "attendance.view");
  const canViewDocuments = can(session, "documents.view");

  const [parentsForSelect, attendance, documents] = await Promise.all([
    canLinkParents
      ? db.parent.findMany({ where: { schoolId }, orderBy: [{ lastName: "asc" }] })
      : Promise.resolve([]),
    canViewAttendance
      ? db.attendance.findMany({ where: { schoolId, studentId: student.id }, orderBy: { date: "desc" }, take: 100 })
      : Promise.resolve([]),
    canViewDocuments
      ? db.document.findMany({
          where: {
            schoolId,
            OR: [{ studentId: student.id }, { entityType: "student", entityId: student.id }],
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
  ]);

  const sp = await searchParams;
  const requested = typeof sp.tab === "string" ? sp.tab : "overview";
  const tab: Tab = TAB_ORDER.includes(requested as Tab) ? (requested as Tab) : "overview";

  const name = fullName(student.firstName, student.middleName, student.lastName);
  const totalBilled = student.invoices.reduce(
    (sum, inv) => sum + inv.items.reduce((s, i) => s + Number(i.amount), 0) - Number(inv.discount),
    0
  );
  const totalPaid = student.invoices.reduce(
    (sum, inv) => sum + inv.payments.reduce((s, p) => s + Number(p.amount), 0),
    0
  );
  const balance = Math.max(0, totalBilled - totalPaid);
  const attendanceRate = attendance.length
    ? Math.round((attendance.filter((a) => a.status === "PRESENT" || a.status === "EXCUSED").length / attendance.length) * 100)
    : null;

  const tabs: ProfileTab[] = [
    { value: "overview", label: "Overview" },
    { value: "academic", label: "Academic", count: student.results.length },
    ...(canViewAttendance ? [{ value: "attendance" as const, label: "Attendance", count: attendance.length }] : []),
    ...(canViewFinance ? [{ value: "fees" as const, label: "Fees", count: student.invoices.length }] : []),
    { value: "parents", label: "Parents", count: student.parents.length },
    ...(canViewDocuments ? [{ value: "documents" as const, label: "Documents", count: documents.length }] : []),
    { value: "notes", label: "Notes", count: student.notes.length },
  ];

  return (
    <div className="space-y-6">
      <SetBreadcrumbLabel path={`/students/${student.id}`} label={name} />
      <PageHeader title={name} description={`${student.admissionNumber} · Admitted ${formatDate(student.admissionDate)}`}>
        {canEdit ? (
          <Button asChild variant="outline">
            <Link href={`/students/${student.id}/edit`}>
              <PencilIcon />
              Edit
            </Link>
          </Button>
        ) : null}
        {canDelete ? (
          <DeleteButton
            action={deleteStudent.bind(null, student.id)}
            confirmTitle="Delete this student?"
            redirectTo="/students"
          />
        ) : null}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <StatusBadge status={student.status} />
        {student.stream ? (
          <span className="text-sm text-muted-foreground">
            {student.stream.class.name} · Stream {student.stream.name}
          </span>
        ) : null}
      </div>

      <ProfileTabs tabs={tabs} value={tab} />

      {tab === "overview" ? (
        <OverviewTab
          student={{
            gender: student.gender,
            dateOfBirth: student.dateOfBirth,
            nationality: student.nationality,
            house: student.house,
            previousSchool: student.previousSchool,
            phone: student.phone,
            email: student.email,
            address: student.address,
            medicalNotes: student.medicalNotes,
          }}
          stats={{
            billed: totalBilled,
            paid: totalPaid,
            balance,
            attendanceRate,
          }}
        />
      ) : null}

      {tab === "academic" ? (
        <AcademicTab
          streamName={student.stream?.name ?? null}
          enrollments={student.enrollments}
          results={student.results}
          canViewResults={canViewResults}
        />
      ) : null}

      {tab === "attendance" && canViewAttendance ? <AttendanceTab attendance={attendance} /> : null}

      {tab === "fees" && canViewFinance ? (
        <FeesTab invoices={student.invoices} balance={balance} totalBilled={totalBilled} totalPaid={totalPaid} />
      ) : null}

      {tab === "parents" ? (
        <ParentsTab
          studentId={student.id}
          linked={student.parents}
          parentsForSelect={parentsForSelect}
          canLinkParents={canLinkParents}
        />
      ) : null}

      {tab === "documents" && canViewDocuments ? <DocumentsTab documents={documents} /> : null}

      {tab === "notes" ? (
        <NotesTab studentId={student.id} notes={student.notes} />
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium break-words">{value ?? "—"}</span>
    </div>
  );
}

function QuickStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${tone ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function OverviewTab({
  student,
  stats,
}: {
  student: {
    gender: string;
    dateOfBirth: Date | null;
    nationality: string | null;
    house: string | null;
    previousSchool: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    medicalNotes: string | null;
  };
  stats: { billed: number; paid: number; balance: number; attendanceRate: number | null };
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuickStat label="Total billed" value={formatMoney(stats.billed)} />
        <QuickStat label="Total paid" value={formatMoney(stats.paid)} />
        <QuickStat
          label="Balance"
          value={formatMoney(stats.balance)}
          tone={stats.balance > 0 ? "text-destructive" : "text-emerald-600"}
        />
        <QuickStat
          label="Attendance rate"
          value={stats.attendanceRate === null ? "—" : `${stats.attendanceRate}%`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Gender" value={student.gender.toLowerCase()} />
            <Info label="Date of birth" value={formatDate(student.dateOfBirth)} />
            <Info label="Nationality" value={student.nationality} />
            <Info label="House" value={student.house} />
            <Info label="Previous school" value={student.previousSchool} />
            <Info label="Phone" value={student.phone} />
            <Info label="Email" value={student.email} />
            <Info label="Address" value={student.address} />
          </CardContent>
        </Card>
        {student.medicalNotes ? (
          <Card>
            <CardHeader>
              <CardTitle>Medical notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{student.medicalNotes}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function AcademicTab({
  streamName,
  enrollments,
  results,
  canViewResults,
}: {
  streamName: string | null;
  enrollments: { id: string; class: { name: string }; term: { name: string } | null }[];
  results: { id: string; exam: { name: string }; examSubject: { subject: { name: string } }; grade: string | null; percentage: unknown }[];
  canViewResults: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Class & stream</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {streamName ? <Info label="Current stream" value={streamName} /> : null}
          {enrollments.length ? (
            <div className="space-y-1.5 border-t pt-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">History</p>
              {enrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs">
                  <span>{e.class.name}</span>
                  <span className="text-muted-foreground">{e.term?.name ?? "—"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Not assigned to a class yet.</p>
          )}
        </CardContent>
      </Card>

      {canViewResults ? (
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Recent results</CardTitle>
            <CardDescription>Latest marks across subjects</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {results.length ? (
              <div className="space-y-2">
                {results.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.examSubject.subject.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.exam.name}</p>
                    </div>
                    <span className="font-mono font-semibold text-primary">
                      {r.grade ?? `${Number(r.percentage)}%`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No results recorded yet.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function AttendanceTab({ attendance }: { attendance: { id: string; date: Date; status: string }[] }) {
  const statuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;
  const counts = Object.fromEntries(statuses.map((s) => [s, attendance.filter((a) => a.status === s).length])) as Record<(typeof statuses)[number], number>;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
        <CardDescription>Summary of the most recent {formatNumber(attendance.length)} records</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {attendance.length ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statuses.map((s) => {
                const count = counts[s];
                const pct = attendance.length ? Math.round((count / attendance.length) * 100) : 0;
                return (
                  <div key={s} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{s.toLowerCase()}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{pct}%</p>
                    <p className="text-xs text-muted-foreground">{count} records</p>
                  </div>
                );
              })}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${counts.PRESENT ? Math.round((counts.PRESENT / attendance.length) * 100) : 0}%` }} />
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {attendance.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span>{formatDate(a.date)}</span>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No attendance records.</p>
        )}
      </CardContent>
    </Card>
  );
}

function FeesTab({
  invoices,
  balance,
  totalBilled,
  totalPaid,
}: {
  invoices: {
    id: string;
    number: string;
    status: string;
    createdAt: Date;
    items: { amount: unknown }[];
    discount: unknown;
    payments: { amount: unknown }[];
  }[];
  balance: number;
  totalBilled: number;
  totalPaid: number;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickStat label="Total billed" value={formatMoney(totalBilled)} />
        <QuickStat label="Total paid" value={formatMoney(totalPaid)} />
        <QuickStat label="Balance" value={formatMoney(balance)} tone={balance > 0 ? "text-destructive" : "text-emerald-600"} />
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {invoices.length ? (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{inv.number}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(inv.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{formatMoney(inv.items.reduce((s, i) => s + Number(i.amount), 0) - Number(inv.discount))}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No invoices yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ParentsTab({
  studentId,
  linked,
  parentsForSelect,
  canLinkParents,
}: {
  studentId: string;
  linked: { id: string; parent: { id: string; firstName: string; lastName: string; relationship: string; phone: string | null } }[];
  parentsForSelect: { id: string; firstName: string; lastName: string; relationship: string }[];
  canLinkParents: boolean;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Link2Icon className="size-4" />
          Parents / guardians
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {linked.length ? (
          <div className="space-y-2">
            {linked.map((sp) => (
              <div key={sp.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback>{initials(`${sp.parent.firstName} ${sp.parent.lastName}`)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {sp.parent.firstName} {sp.parent.lastName}
                      <span className="ml-2 text-xs text-muted-foreground">{sp.parent.relationship}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{sp.parent.phone}</p>
                  </div>
                </div>
                {canLinkParents ? (
                  <form
                    action={async () => {
                      await unlinkParent(studentId, sp.parent.id);
                    }}
                  >
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label="Unlink parent">
                      <UnlinkIcon />
                    </Button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No parents linked.</p>
        )}

        {canLinkParents ? (
          <ActionForm
            action={linkParent.bind(null, studentId)}
            onSuccess={() => toast.success("Parent linked")}
            className="mt-4 flex gap-2"
          >
            <NativeSelect
              name="parentId"
              required
              options={parentsForSelect.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.relationship})` }))}
              placeholder="Select a parent…"
              className="flex-1"
            />
            <SubmitButton size="sm">Link</SubmitButton>
          </ActionForm>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DocumentsTab({ documents }: { documents: { id: string; name: string; fileType: string; url: string; createdAt: Date }[] }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {documents.length ? (
          <div className="space-y-2">
            {documents.map((d) => (
              <Link
                key={d.id}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.fileType || "File"} · {formatDate(d.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No documents uploaded.</p>
        )}
      </CardContent>
    </Card>
  );
}

function NotesTab({
  studentId,
  notes,
}: {
  studentId: string;
  notes: { id: string; title: string; body: string | null; createdAt: Date }[];
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {notes.length ? (
          <div className="mb-4 space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body ? <p className="mt-0.5 text-sm text-muted-foreground whitespace-pre-wrap">{n.body}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : null}
        <ActionForm
          action={addStudentNote}
          onSuccess={() => toast.success("Note added")}
          className="space-y-3"
        >
          <input type="hidden" name="studentId" value={studentId} />
          <TextInput name="title" label="Add a note" placeholder="Note title" />
          <TextAreaField name="body" label="Details" placeholder="Write something useful about this student…" rows={2} />
          <div className="flex justify-end">
            <SubmitButton size="sm">Add note</SubmitButton>
          </div>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
