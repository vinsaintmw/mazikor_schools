import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CreateSchoolWizard } from "@/components/admin/create-school-wizard";

export const metadata = { title: "Create school" };

export default async function AdminCreateSchoolPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKey !== "super_admin") redirect("/dashboard");

  const plans = (await db.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, priceMonthly: true, priceYearly: true },
  })).map((p) => ({
    id: p.id,
    name: p.name,
    priceMonthly: p.priceMonthly.toNumber(),
    priceYearly: p.priceYearly.toNumber(),
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Create school" description="Onboard a new institution onto the platform">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/schools">Back to schools</Link>
        </Button>
      </PageHeader>
      <CreateSchoolWizard plans={plans} />
    </div>
  );
}
