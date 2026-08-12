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
import { DeleteButton } from "@/components/delete-button";
import { deleteParent } from "@/lib/actions/people";

export const metadata = { title: "Edit parent" };

export default async function EditParentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  if (!can(session, "parents.edit")) redirect("/parents");

  const { id } = await params;
  const parent = await db.parent.findFirst({ where: { id, schoolId } });
  if (!parent) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon-sm">
          <Link href="/parents">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <PageHeader
          title={`Edit ${parent.firstName} ${parent.lastName}`}
          description={parent.phone}
        />
        <div className="ml-auto">
          {can(session, "parents.delete") ? (
            <DeleteButton
              action={deleteParent.bind(null, parent.id)}
              confirmTitle="Delete this parent?"
              redirectTo="/parents"
            />
          ) : null}
        </div>
      </div>
      <div className="max-w-3xl rounded-xl border bg-card p-5">
        <ParentForm
          mode="edit"
          parent={{
            id: parent.id,
            firstName: parent.firstName,
            lastName: parent.lastName,
            phone: parent.phone,
            email: parent.email,
            address: parent.address,
            occupation: parent.occupation,
            relationship: parent.relationship,
            isEmergency: parent.isEmergency,
          }}
        />
      </div>
    </div>
  );
}
