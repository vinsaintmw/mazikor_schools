import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDaysIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId, getCurrentYearAndTerm } from "@/lib/server-helpers";
import { saveAttendance } from "@/lib/actions/academics";
import { todayISO, formatDate, fullName } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { ActionForm } from "@/components/action-form";
import { NativeSelect } from "@/components/forms";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Attendance" };

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  const sp = await searchParams;
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]);

  const date = get("date") || todayISO();
  const streamId = get("streamId") || "";
  const subjectId = get("subjectId") || "";
  const canManage = can(session, "attendance.manage");

  const [{ year, term }, streams, subjects] = await Promise.all([
    getCurrentYearAndTerm(schoolId),
    db.stream.findMany({ where: { schoolId }, include: { class: true }, orderBy: [{ class: { level: "asc" } }, { name: "asc" }] }),
    db.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
  ]);

  const students = streamId
    ? await db.student.findMany({
        where: { schoolId, streamId, status: "ACTIVE" },
        include: { stream: true },
        orderBy: [{ lastName: "asc" }],
      })
    : [];

  const existing = streamId
    ? await db.attendance.findMany({
        where: {
          schoolId,
          streamId,
          subjectId: subjectId || null,
          date: { gte: new Date(`${date}T00:00:00`), lte: new Date(`${date}T23:59:59`) },
        },
      })
    : [];
  const existingByStudent = new Map(existing.map((e) => [e.studentId, e]));

  const recent = await db.attendance.findMany({
    where: { schoolId },
    orderBy: { date: "desc" },
    take: 12,
    include: { student: { select: { firstName: true, lastName: true, admissionNumber: true } }, stream: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description={`${term?.name ?? ""} ${year?.name ?? ""} · ${formatDate(date)}`} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mark attendance</CardTitle>
            <CardDescription>
              Select a date, stream and subject, then set each student&apos;s status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={saveAttendance}
              className="space-y-4"
              successLabel="Attendance saved"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <NativeSelect
                  name="date"
                  defaultValue={date}
                  options={[date]}
                  placeholder="Date"
                  className="hidden"
                />
                <input type="hidden" name="date" value={date} />
                <NativeSelect
                  name="streamId"
                  defaultValue={streamId}
                  options={streams.map((s) => ({ value: s.id, label: s.name }))}
                  placeholder="Select class stream"
                />
                <NativeSelect
                  name="subjectId"
                  defaultValue={subjectId || null}
                  options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                  placeholder="Whole day (optional)"
                />
              </div>

              <Link
                href={`?date=${date}`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <CalendarDaysIcon className="size-3.5" />
                Today: {formatDate(new Date())}
              </Link>

              {students.length ? (
                <div className="rounded-lg border">
                  <Table className="table-cards">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="w-32">Status</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s) => {
                        const ex = existingByStudent.get(s.id);
                        return (
                          <TableRow key={s.id}>
                            <TableCell data-label="Student" data-span="full">
                              <span className="font-medium">{fullName(s.firstName, s.middleName, s.lastName)}</span>
                              <span className="ml-2 font-mono text-xs text-muted-foreground">{s.admissionNumber}</span>
                            </TableCell>
                            <TableCell data-label="Status">
                              {canManage ? (
                                <select
                                  name={`status_${s.id}`}
                                  defaultValue={ex?.status ?? "PRESENT"}
                                  className="h-10 w-full rounded-lg border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8 sm:text-sm dark:bg-input/30"
                                >
                                  {STATUSES.map((st) => (
                                    <option key={st} value={st}>
                                      {st.toLowerCase()}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <StatusBadge status={ex?.status ?? "PRESENT"} />
                              )}
                            </TableCell>
                            <TableCell data-label="Note">
                              {canManage ? (
                                <input
                                  name={`note_${s.id}`}
                                  defaultValue={ex?.note ?? ""}
                                  placeholder="Optional note"
                                  className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8 sm:text-sm dark:bg-input/30"
                                />
                              ) : (
                                <span className="text-sm text-muted-foreground">{ex?.note ?? "—"}</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                  {streamId ? "No active students in this stream." : "Select a class stream to mark attendance."}
                </p>
              )}

              {students.length && canManage ? (
                <div className="flex justify-end">
                  <SubmitButton>Save attendance</SubmitButton>
                </div>
              ) : null}
            </ActionForm>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Recent records</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recent.length ? (
              <div className="space-y-2">
                {recent.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {r.student.firstName} {r.student.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.stream?.name ?? "—"} · {formatDate(r.date)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No attendance records yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
