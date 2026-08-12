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
import { DeleteButton } from "@/components/delete-button";
import { deleteStaff } from "@/lib/actions/people";

export const metadata = { title: "Edit staff" };

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  if (!can(session, "staff.edit")) redirect("/staff");

  const { id } = await params;
  const staff = await db.staff.findFirst({ where: { id, schoolId } });
  if (!staff) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon-sm">
          <Link href="/staff">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <PageHeader title={`Edit ${staff.firstName} ${staff.lastName}`} description={staff.employeeId} />
        <div className="ml-auto">
          {can(session, "staff.delete") ? (
            <DeleteButton
              action={deleteStaff.bind(null, staff.id)}
              confirmTitle="Delete this staff member?"
              redirectTo="/staff"
            />
          ) : null}
        </div>
      </div>
      <div className="max-w-3xl rounded-xl border bg-card p-5">
        <StaffForm
          mode="edit"
          staff={{
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            gender: staff.gender,
            phone: staff.phone,
            email: staff.email,
            address: staff.address,
            position: staff.position,
            department: staff.department,
            joiningDate: staff.joiningDate,
            employmentType: staff.employmentType,
            salary: Number(staff.salary ?? 0),
            status: staff.status,
          }}
        />
      </div>
    </div>
  );
}
