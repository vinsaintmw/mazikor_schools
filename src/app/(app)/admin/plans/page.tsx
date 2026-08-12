import { redirect } from "next/navigation";
import { PackageIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Plans" };

export default async function AdminPlansPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKey !== "super_admin") redirect("/dashboard");

  const plans = await db.plan.findMany({ orderBy: [{ sortOrder: "asc" }], include: { _count: { select: { subscriptions: true } } } });

  return (
    <div className="space-y-4">
      <PageHeader title="Plans" description="Pricing plans available to schools" />

      {plans.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Monthly</TableHead>
                <TableHead>Yearly</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      {p.description ? <p className="text-xs text-muted-foreground">{p.description}</p> : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{formatMoney(p.priceMonthly)}</TableCell>
                  <TableCell className="font-mono">{formatMoney(p.priceYearly)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.maxStudents} students · {p.maxTeachers} teachers · {p.maxStaff} staff · {p.maxStorageGB} GB
                  </TableCell>
                  <TableCell className="font-mono">{p._count.subscriptions}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.isActive ? "ACTIVE" : "WITHDRAWN"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No plans defined"
          description="Create pricing plans for schools to subscribe to."
          icon={<PackageIcon className="size-6" />}
        />
      )}
    </div>
  );
}
