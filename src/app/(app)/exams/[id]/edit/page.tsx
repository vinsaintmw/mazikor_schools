import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ExamForm } from "@/components/exams/exam-form";

export const metadata = { title: "Edit exam" };

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session, "exams.edit")) redirect("/exams");
  const schoolId = getSchoolId(session);

  const { id } = await params;
  const exam = await db.exam.findFirst({ where: { id, schoolId } });
  if (!exam) notFound();

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
      <PageHeader title="Edit exam" description="Update the exam details.">
        <Button asChild variant="outline">
          <Link href={`/exams/${exam.id}`}>
            <ArrowLeftIcon />
            Back
          </Link>
        </Button>
      </PageHeader>
      <div className="rounded-xl border bg-card p-5">
        <ExamForm
          exam={{
            id: exam.id,
            name: exam.name,
            type: exam.type,
            termId: exam.termId,
            gradeScaleId: exam.gradeScaleId,
            startDate: exam.startDate,
            endDate: exam.endDate,
            description: exam.description,
          }}
          terms={terms.map((t) => ({ id: t.id, name: `${t.academicYear.name} · ${t.name}` }))}
          gradeScales={gradeScales.map((g) => ({ id: g.id, name: g.name }))}
          mode="edit"
        />
      </div>
    </div>
  );
}
