import Link from "next/link";
import {
  BarChart3Icon,
  WalletIcon,
  AwardIcon,
  CalendarCheckIcon,
  FileSpreadsheetIcon,
  ReceiptIcon,
  ArrowRightIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { formatMoney, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);

  const canViewFinance = can(session, "finance.reports");
  const canViewResults = can(session, "results.view");

  const [studentCount, revenueAgg, expenseAgg] = await Promise.all([
    db.student.count({ where: { schoolId, status: "ACTIVE" } }),
    canViewFinance ? db.payment.aggregate({ where: { schoolId }, _sum: { amount: true } }) : Promise.resolve(null),
    canViewFinance ? db.expense.aggregate({ where: { schoolId }, _sum: { amount: true } }) : Promise.resolve(null),
  ]);

  const sections = [
    {
      title: "Financial reports",
      description: "Revenue, expenses and outstanding balances.",
      href: "/finance",
      icon: <WalletIcon className="size-5" />,
      show: canViewFinance,
    },
    {
      title: "Fee structures",
      description: "Tuition and boarding fee schedules.",
      href: "/fees",
      icon: <ReceiptIcon className="size-5" />,
      show: can(session, "fees.view"),
    },
    {
      title: "Results",
      description: "Marks and grades across examinations.",
      href: "/results",
      icon: <AwardIcon className="size-5" />,
      show: canViewResults,
    },
    {
      title: "Report cards",
      description: "Generate and download student report cards.",
      href: "/report-cards",
      icon: <FileSpreadsheetIcon className="size-5" />,
      show: can(session, "reportcards.view"),
    },
    {
      title: "Attendance",
      description: "Attendance records and summaries.",
      href: "/attendance",
      icon: <CalendarCheckIcon className="size-5" />,
      show: can(session, "attendance.view"),
    },
    {
      title: "Expenses",
      description: "School spending by category.",
      href: "/expenses",
      icon: <BarChart3Icon className="size-5" />,
      show: canViewFinance,
    },
  ].filter((s) => s.show);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Insights and exportable summaries" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={<CalendarCheckIcon className="size-4" />}
          label="Active students"
          value={formatNumber(studentCount)}
          sub="Enrolled this year"
          href="/students"
        />
        {canViewFinance ? (
          <StatCard
            icon={<WalletIcon className="size-4" />}
            label="Total collected"
            value={formatMoney(revenueAgg?._sum.amount ?? 0)}
            sub="All payments received"
            href="/finance"
            tone="text-emerald-600"
          />
        ) : null}
        {canViewFinance ? (
          <StatCard
            icon={<ReceiptIcon className="size-4" />}
            label="Total spending"
            value={formatMoney(expenseAgg?._sum.amount ?? 0)}
            sub="All expenses recorded"
            href="/expenses"
            tone="text-rose-600"
          />
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <CardDescription>{s.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Open report</span>
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
