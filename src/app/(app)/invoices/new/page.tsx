import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { fullName } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/finance/invoice-form";

export const metadata = { title: "New invoice" };

export default async function NewInvoicePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session, "invoices.create")) redirect("/invoices");
  const schoolId = getSchoolId(session);

  const [students, terms] = await Promise.all([
    db.student.findMany({ where: { schoolId }, orderBy: [{ lastName: "asc" }] }),
    db.term.findMany({
      where: { schoolId },
      include: { academicYear: true },
      orderBy: [{ academicYear: { startDate: "desc" } }, { termNumber: "asc" }],
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New invoice" description="Bill a student for fees and other charges." />
      <div className="rounded-xl border bg-card p-5">
        <InvoiceForm
          students={students.map((s) => ({ id: s.id, name: `${fullName(s.firstName, s.middleName, s.lastName)} (${s.admissionNumber})` }))}
          terms={terms.map((t) => ({ id: t.id, name: `${t.academicYear.name} · ${t.name}` }))}
        />
      </div>
    </div>
  );
}
