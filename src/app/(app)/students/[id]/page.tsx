import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PencilIcon, Link2Icon, UnlinkIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { fullName, formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { NativeSelect } from "@/components/forms";
import { DeleteButton } from "@/components/delete-button";
import { initials } from "@/lib/format";
import { deleteStudent, linkParent, unlinkParent, addStudentNote } from "@/lib/actions/people";
import { TextAreaField, TextInput } from "@/components/forms";

export const metadata = { title: "Student profile" };

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const parentsForSelect = canLinkParents
    ? await db.parent.findMany({ where: { schoolId }, orderBy: [{ lastName: "asc" }] })
    : [];

  const attendance = can(session, "attendance.view")
    ? await db.attendance.findMany({ where: { schoolId, studentId: student.id }, orderBy: { date: "desc" }, take: 100 })
    : [];

  const name = fullName(student.firstName, student.middleName, student.lastName);
  const totalBilled = student.invoices.reduce(
    (sum, inv) => sum + inv.items.reduce((s, i) => s + Number(i.amount), 0) - Number(inv.discount),
    0
  );
  const totalPaid = student.invoices.reduce(
    (sum, inv) => sum + inv.payments.reduce((s, p) => s + Number(p.amount), 0),
    0
  );

  return (
    <div className="space-y-6">
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

      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <div>
          <StatusBadge status={student.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
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
                <p className="text-sm">{student.medicalNotes}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Class & stream</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {student.stream ? (
                <Info label="Class" value={`${student.stream.name}`} />
              ) : (
                <p className="text-muted-foreground">Not assigned to a class yet.</p>
              )}
              {student.enrollments.length ? (
                <div className="space-y-1.5 border-t pt-3">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">History</p>
                  {student.enrollments.map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-xs">
                      <span>{e.class.name}</span>
                      <span className="text-muted-foreground">{e.term?.name ?? "—"}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {canViewResults && student.results.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {student.results.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="truncate">{r.examSubject.subject.name}</span>
                    <span className="font-mono font-semibold">
                      {r.grade ?? `${Number(r.percentage)}%`}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">{Number(r.percentage)}%</span>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4 lg:col-span-2">
          {canLinkParents ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Link2Icon className="size-4" />
                  Parents / guardians
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {student.parents.length ? (
                  <div className="space-y-2">
                    {student.parents.map((sp) => (
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
                        <form action={unlinkParent.bind(null, student.id, sp.parent.id)}>
                          <Button type="submit" variant="ghost" size="icon-sm" aria-label="Unlink parent">
                            <UnlinkIcon />
                          </Button>
                        </form>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No parents linked.</p>
                )}

                <form action={linkParent.bind(null, student.id)} className="mt-4 flex gap-2">
                  <NativeSelect
                    name="parentId"
                    required
                    options={parentsForSelect.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.relationship})` }))}
                    placeholder="Select a parent…"
                    className="flex-1"
                  />
                  <SubmitButton size="sm">Link</SubmitButton>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {canViewFinance ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                  <span>Invoices</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Balance: <span className={totalBilled - totalPaid > 0 ? "font-semibold text-destructive" : "font-semibold text-emerald-600"}>
                      {formatMoney(Math.max(0, totalBilled - totalPaid))}
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {student.invoices.length ? (
                  <div className="space-y-2">
                    {student.invoices.map((inv) => (
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
          ) : null}

          {can(session, "attendance.view") ? (
            <Card>
              <CardHeader>
                <CardTitle>Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {attendance.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((s) => {
                      const count = attendance.filter((a) => a.status === s).length;
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
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">No attendance records.</p>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {student.notes.length ? (
                <div className="mb-4 space-y-2">
                  {student.notes.map((n) => (
                    <div key={n.id} className="rounded-lg bg-muted/40 px-3 py-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body ? <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p> : null}
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <form action={addStudentNote} className="space-y-3">
                <input type="hidden" name="studentId" value={student.id} />
                <TextInput name="title" label="Add a note" placeholder="Note title" />
                <TextAreaField name="body" label="Details" placeholder="Write something useful about this student…" rows={2} />
                <div className="flex justify-end">
                  <SubmitButton size="sm">Add note</SubmitButton>
                </div>
              </form>
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
