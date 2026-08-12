import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { PageHeader } from "@/components/page-header";
import { TeacherForm } from "@/components/teachers/teacher-form";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { deleteTeacher } from "@/lib/actions/people";

export const metadata = { title: "Edit teacher" };

export default async function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  if (!can(session, "teachers.edit")) redirect("/teachers");

  const { id } = await params;
  const teacher = await db.teacher.findFirst({ where: { id, schoolId } });
  if (!teacher) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon-sm">
          <Link href={`/teachers/${teacher.id}`}>
            <ArrowLeftIcon />
          </Link>
        </Button>
        <PageHeader
          title={`Edit ${teacher.firstName} ${teacher.lastName}`}
          description={teacher.employeeId}
        />
        <div className="ml-auto flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/teachers/${teacher.id}`}>
              <PencilIcon className="hidden" />
              View profile
            </Link>
          </Button>
          {can(session, "teachers.delete") ? (
            <DeleteButton
              action={deleteTeacher.bind(null, teacher.id)}
              confirmTitle="Delete this teacher?"
              redirectTo="/teachers"
            />
          ) : null}
        </div>
      </div>
      <div className="max-w-3xl rounded-xl border bg-card p-5">
        <TeacherForm
          mode="edit"
          teacher={{
            id: teacher.id,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            gender: teacher.gender,
            dateOfBirth: teacher.dateOfBirth,
            phone: teacher.phone,
            email: teacher.email,
            address: teacher.address,
            qualification: teacher.qualification,
            specialization: teacher.specialization,
            joiningDate: teacher.joiningDate,
            employmentType: teacher.employmentType,
            salary: Number(teacher.salary ?? 0),
            status: teacher.status,
          }}
        />
      </div>
    </div>
  );
}
