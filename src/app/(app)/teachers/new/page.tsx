import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { PageHeader } from "@/components/page-header";
import { TeacherForm } from "@/components/teachers/teacher-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New teacher" };

export default async function NewTeacherPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  if (!can(session, "teachers.create")) redirect("/teachers");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon-sm">
          <Link href="/teachers">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <PageHeader title="New teacher" description="Add a member of the teaching staff" />
      </div>
      <div className="max-w-3xl rounded-xl border bg-card p-5">
        <TeacherForm mode="create" />
      </div>
    </div>
  );
}
