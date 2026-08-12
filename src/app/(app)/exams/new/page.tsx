import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { PageHeader } from "@/components/page-header";
import { ExamForm } from "@/components/exams/exam-form";

export const metadata = { title: "New exam" };

export default async function NewExamPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session, "exams.create")) redirect("/exams");
  const schoolId = getSchoolId(session);

  const [terms, gradeScales] = await Promise.all([
    db.term.findMany({
      where: { schoolId },
      include: { academicYear: true },
      orderBy: [{ academicYear: { startDate: "desc" } }, { termNumber: "asc" }],
    }),
    db.gradeScale.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New exam" description="Set up an examination for a term." />
      <div className="rounded-xl border bg-card p-5">
        <ExamForm
          terms={terms.map((t) => ({ id: t.id, name: `${t.academicYear.name} · ${t.name}` }))}
          gradeScales={gradeScales.map((g) => ({ id: g.id, name: g.name }))}
          mode="create"
        />
      </div>
    </div>
  );
}
