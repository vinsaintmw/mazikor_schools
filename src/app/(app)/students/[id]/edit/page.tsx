import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { PageHeader } from "@/components/page-header";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import { fullName } from "@/lib/format";

export const metadata = { title: "Edit student" };

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const schoolId = getSchoolId(session);
  if (!can(session, "students.edit")) redirect("/students");

  const { id } = await params;
  const student = await db.student.findFirst({ where: { id, schoolId } });
  if (!student) notFound();

  const streams = await db.stream.findMany({
    where: { schoolId },
    include: { class: true },
    orderBy: [{ class: { level: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon-sm">
          <Link href={`/students/${student.id}`}>
            <ArrowLeftIcon />
          </Link>
        </Button>
        <PageHeader
          title={`Edit ${fullName(student.firstName, student.middleName, student.lastName)}`}
          description={`${student.admissionNumber} · ${student.streamId ? "Currently assigned to a class" : "No class assigned"}`}
        />
      </div>
      <div className="max-w-3xl rounded-xl border bg-card p-5">
        <StudentForm
          mode="edit"
          student={{
            id: student.id,
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
            gender: student.gender,
            dateOfBirth: student.dateOfBirth,
            nationality: student.nationality,
            admissionNumber: student.admissionNumber,
            admissionDate: student.admissionDate,
            streamId: student.streamId,
            phone: student.phone,
            email: student.email,
            house: student.house,
            previousSchool: student.previousSchool,
            address: student.address,
            medicalNotes: student.medicalNotes,
            status: student.status,
          }}
          streams={streams.map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>
    </div>
  );
}
