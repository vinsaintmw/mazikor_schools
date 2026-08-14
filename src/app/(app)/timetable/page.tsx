import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClockIcon, PlusIcon, XIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { DAYS_OF_WEEK, PERIOD_TIMES } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { ActionForm } from "@/components/action-form";
import { TextInput, NativeSelect } from "@/components/forms";
import { EmptyState } from "@/components/empty-state";
import { addTimetableEntry, deleteTimetableEntry } from "@/lib/actions/academics";

export const metadata = { title: "Timetable" };

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  const sp = await searchParams;
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]);
  const classId = get("classId") ?? "";
  const streamId = get("streamId") ?? "";

  const canManage = can(session, "timetable.manage");

  const [classes, teachers, subjects] = await Promise.all([
    db.class.findMany({ where: { schoolId }, orderBy: { level: "asc" } }),
    db.teacher.findMany({ where: { schoolId, status: "ACTIVE" }, orderBy: [{ lastName: "asc" }] }),
    db.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
  ]);

  const streams = classId
    ? await db.stream.findMany({ where: { schoolId, classId }, orderBy: { name: "asc" } })
    : [];

  const activeClassId = classId || classes[0]?.id || "";
  const activeStreamId = streamId || streams[0]?.id || "";

  const entries = activeStreamId
    ? await db.timetableEntry.findMany({
        where: { schoolId, streamId: activeStreamId },
        include: { subject: true, teacher: true },
        orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
      })
    : activeClassId
      ? await db.timetableEntry.findMany({
          where: { schoolId, streamId: null, classId: activeClassId },
          include: { subject: true, teacher: true },
          orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
        })
      : [];

  const bySlot = new Map<string, (typeof entries)[number]>();
  for (const e of entries) {
    bySlot.set(`${e.dayOfWeek}-${e.period}`, e);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Timetable" description="Class timetable grid" />

      <form className="flex flex-wrap items-end gap-2">
        <NativeSelect
          name="classId"
          label="Class"
          defaultValue={activeClassId || null}
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select class"
          className="w-48"
        />
        <NativeSelect
          name="streamId"
          label="Stream"
          defaultValue={activeStreamId || null}
          options={streams.map((s) => ({ value: s.id, label: s.name }))}
          placeholder="All streams"
          className="w-48"
        />
        {activeClassId ? (
          <Button asChild variant="outline" className="h-8">
            <Link href="/timetable">Clear</Link>
          </Button>
        ) : null}
      </form>

      {entries.length ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="w-20 px-3 py-2 text-left font-semibold">Period</th>
                {DAYS_OF_WEEK.map((d) => (
                  <th key={d} className="px-3 py-2 text-left font-semibold">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIOD_TIMES.map((p) => (
                <tr key={p.period} className="border-b last:border-0">
                  <td className="px-3 py-2 align-top">
                    <p className="font-medium">{p.period}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.start}–{p.end}
                    </p>
                  </td>
                  {DAYS_OF_WEEK.map((_, di) => {
                    const entry = bySlot.get(`${di + 1}-${p.period}`);
                    return (
                      <td key={di} className="px-3 py-2 align-top">
                        {entry ? (
                          <div className="group relative rounded-lg border bg-primary/5 px-2.5 py-1.5">
                            <p className="font-medium">{entry.subject.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.teacher.firstName} {entry.teacher.lastName}
                            </p>
                            {entry.room ? <p className="text-xs text-muted-foreground">Room {entry.room}</p> : null}
                            {canManage ? (
                              <form
                                action={async () => {
                                  await deleteTimetableEntry(entry.id);
                                }}
                                className="absolute -top-1.5 -right-1.5 hidden group-hover:block"
                              >
                                <Button type="submit" variant="destructive" size="icon-xs" aria-label="Remove entry">
                                  <XIcon />
                                </Button>
                              </form>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No timetable entries"
          description={activeClassId ? "Add timetable entries for this class below." : "Select a class to view or add timetable entries."}
          icon={<CalendarClockIcon className="size-6" />}
        />
      )}

      {canManage && activeClassId ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="size-4" />
              Add timetable entry
            </CardTitle>
            <CardDescription>Assign a subject and teacher to a period.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ActionForm action={addTimetableEntry} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" successLabel="Entry added">
              <input type="hidden" name="classId" value={activeClassId} />
              <input type="hidden" name="streamId" value={activeStreamId || ""} />
              <NativeSelect
                name="teacherId"
                label="Teacher"
                required
                options={teachers.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))}
                placeholder="Select teacher"
              />
              <NativeSelect
                name="subjectId"
                label="Subject"
                required
                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Select subject"
              />
              <NativeSelect
                name="dayOfWeek"
                label="Day"
                required
                options={DAYS_OF_WEEK.map((d, i) => ({ value: String(i + 1), label: d }))}
              />
              <NativeSelect
                name="period"
                label="Period"
                required
                options={PERIOD_TIMES.map((p) => ({
                  value: String(p.period),
                  label: `${p.period} (${p.start}–${p.end})`,
                }))}
              />
              <TextInput name="startTime" label="Start time" type="time" placeholder="07:30" />
              <TextInput name="endTime" label="End time" type="time" placeholder="08:30" />
              <TextInput name="room" label="Room" placeholder="e.g. R-11" />
              <div className="flex items-end lg:col-span-1">
                <SubmitButton className="w-full">
                  <PlusIcon />
                  Add entry
                </SubmitButton>
              </div>
            </ActionForm>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
