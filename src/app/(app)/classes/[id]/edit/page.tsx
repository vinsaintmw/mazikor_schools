import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { PageHeader } from "@/components/page-header";
import { ClassForm } from "@/components/classes/class-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Edit class" };

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  if (!can(session, "classes.edit")) redirect("/classes");

  const { id } = await params;
  const cls = await db.class.findFirst({ where: { id, schoolId } });
  if (!cls) notFound();

  const teachers = await db.teacher.findMany({
    where: { schoolId, status: "ACTIVE" },
    orderBy: [{ lastName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon-sm">
          <Link href={`/classes/${cls.id}`}>
            <ArrowLeftIcon />
          </Link>
        </Button>
        <PageHeader title={`Edit ${cls.name}`} description={`Level ${cls.level}`} />
      </div>
      <div className="max-w-3xl rounded-xl border bg-card p-5">
        <ClassForm
          mode="edit"
          classData={{
            id: cls.id,
            name: cls.name,
            level: cls.level,
            capacity: cls.capacity,
            room: cls.room,
            classTeacherId: cls.classTeacherId,
          }}
          teachers={teachers.map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` }))}
        />
      </div>
    </div>
  );
}
