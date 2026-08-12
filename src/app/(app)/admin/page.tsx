import { redirect } from "next/navigation";
import { SchoolIcon, UsersIcon, CreditCardIcon, PackageIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatMoney, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";

export const metadata = { title: "Platform Overview" };

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKey !== "super_admin") redirect("/dashboard");

  const [schoolCount, userCount, activeSubs, trialSubs, planCount, revenueAgg, recentActivity, recentSchools] =
    await Promise.all([
      db.school.count(),
      db.user.count(),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.subscription.count({ where: { status: "TRIAL" } }),
      db.plan.count({ where: { isActive: true } }),
      db.payment.aggregate({ _sum: { amount: true } }),
      db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } }, school: { select: { name: true } } } }),
      db.school.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { subscription: { include: { plan: true } } } }),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Platform overview" description="High-level health of the Mazikor Schools platform" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<SchoolIcon className="size-4" />}
          label="Schools"
          value={String(schoolCount)}
          sub="Registered institutions"
          href="/admin/schools"
        />
        <StatCard
          icon={<UsersIcon className="size-4" />}
          label="Users"
          value={String(userCount)}
          sub="Accounts across schools"
          href="/admin/users"
        />
        <StatCard
          icon={<CreditCardIcon className="size-4" />}
          label="Active subscriptions"
          value={String(activeSubs)}
          sub={`${trialSubs} on trial`}
          href="/admin/subscriptions"
          tone="text-emerald-600"
        />
        <StatCard
          icon={<PackageIcon className="size-4" />}
          label="Active plans"
          value={String(planCount)}
          sub="Available pricing plans"
          href="/admin/plans"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest audit log entries</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {recentActivity.length ? (
              <div className="space-y-2">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        <span className="font-medium">{log.user?.name ?? "System"}</span>{" "}
                        <span className="text-muted-foreground">
                          · {log.action.toLowerCase()} · {log.entity}
                        </span>
                      </p>
                      {log.school ? <p className="text-xs text-muted-foreground">{log.school.name}</p> : null}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No activity yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Total collected</CardTitle>
            <CardDescription>All payments on the platform</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatMoney(revenueAgg._sum.amount ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Newest schools</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {recentSchools.length ? (
            <div className="divide-y">
              {recentSchools.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.code} · {s.phone ?? "no phone"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">{s.subscription?.plan.name ?? "No plan"}</span>
                    <StatusBadge status={s.subscription?.status ?? "EXPIRED"} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No schools registered yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
