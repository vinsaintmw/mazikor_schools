import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { PageHeader } from "@/components/page-header";
import { StaffForm } from "@/components/staff/staff-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New staff" };

export default async function NewStaffPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  if (!can(session, "staff.create")) redirect("/staff");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon-sm">
          <Link href="/staff">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <PageHeader title="New staff" description="Add a non-teaching staff member" />
      </div>
      <div className="max-w-3xl rounded-xl border bg-card p-5">
        <StaffForm mode="create" />
      </div>
    </div>
  );
}
