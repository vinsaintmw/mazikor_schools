import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { PageHeader } from "@/components/page-header";
import { ParentForm } from "@/components/parents/parent-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New parent" };

export default async function NewParentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  if (!can(session, "parents.create")) redirect("/parents");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon-sm">
          <Link href="/parents">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <PageHeader title="New parent" description="Add a parent or guardian" />
      </div>
      <div className="max-w-3xl rounded-xl border bg-card p-5">
        <ParentForm mode="create" />
      </div>
    </div>
  );
}
