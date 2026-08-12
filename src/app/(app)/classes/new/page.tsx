import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { PageHeader } from "@/components/page-header";
import { ClassForm } from "@/components/classes/class-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New class" };

export default async function NewClassPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  if (!can(session, "classes.create")) redirect("/classes");

  const teachers = await db.teacher.findMany({
    where: { schoolId, status: "ACTIVE" },
    orderBy: [{ lastName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon-sm">
          <Link href="/classes">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <PageHeader title="New class" description="Create a class and its streams" />
      </div>
      <div className="max-w-3xl rounded-xl border bg-card p-5">
        <ClassForm
          mode="create"
          teachers={teachers.map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` }))}
        />
      </div>
    </div>
  );
}
