import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SchoolIcon, UsersIcon } from "lucide-react";
import { formatNumber } from "@/lib/format";

export const metadata = { title: "Classes" };

export default async function ClassesPage() {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);

  const classes = await db.class.findMany({
    where: { schoolId },
    include: {
      streams: { include: { _count: { select: { students: { where: { status: "ACTIVE" } } } } } },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } }, subjects: true } },
      classTeacher: true,
    },
    orderBy: { level: "asc" },
  });

  const canCreate = can(session, "classes.create");

  return (
    <div className="space-y-4">
      <PageHeader title="Classes" description="Classes, streams and subject allocation">
        {canCreate ? (
          <Button asChild>
            <Link href="/classes/new">
              <PlusIcon />
              New class
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      {classes.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => (
            <Link key={c.id} href={`/classes/${c.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{c.name}</CardTitle>
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <SchoolIcon className="size-4" />
                    </span>
                  </div>
                  <CardDescription>
                    {c.classTeacher ? `Teacher: ${c.classTeacher.firstName} ${c.classTeacher.lastName}` : "No class teacher"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <UsersIcon className="size-3.5" />
                      {formatNumber(c._count.enrollments)} students
                    </span>
                    <span className="text-muted-foreground">
                      {c.streams.length} stream{c.streams.length === 1 ? "" : "s"}
                    </span>
                    <span className="text-muted-foreground">
                      {c._count.subjects} subjects
                    </span>
                  </div>
                  {c.streams.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {c.streams.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {s.name} · {formatNumber(s._count.students)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No classes yet"
          description="Create a class to start organising students and subjects."
          action={canCreate ? { label: "New class", href: "/classes/new" } : undefined}
          icon={<SchoolIcon className="size-6" />}
        />
      )}
    </div>
  );
}
