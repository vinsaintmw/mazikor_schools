import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New student" };

export default async function NewStudentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  if (!can(session, "students.create")) redirect("/students");

  const streams = await db.stream.findMany({
    where: { schoolId },
    include: { class: true },
    orderBy: [{ class: { level: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon-sm">
          <Link href="/students">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <PageHeader title="New student" description="Add a new student to the school register" />
      </div>
      <div className="max-w-3xl rounded-xl border bg-card p-5">
        <StudentForm
          mode="create"
          streams={streams.map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>
    </div>
  );
}
