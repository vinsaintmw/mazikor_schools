import Link from "next/link";
import { redirect } from "next/navigation";
import {
  UsersIcon,
  GraduationCapIcon,
  UserCogIcon,
  WalletIcon,
  ReceiptIcon,
  AlertTriangleIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  AwardIcon,
  ArrowRightIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { formatMoney, formatNumber, formatDate, timeAgo } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { startOfDay, endOfDay } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { RevenueChart } from "./revenue-chart";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKey === "super_admin") redirect("/admin");
  const schoolId = getSchoolId(session);

  const today = new Date();
  const isSchoolAdmin = can(session, "settings.manage");

  const [studentsCount, teachersCount, staffCount, activeStudents, classes, streams] = await Promise.all([
    db.student.count({ where: { schoolId } }),
    db.teacher.count({ where: { schoolId, status: "ACTIVE" } }),
    db.staff.count({ where: { schoolId, status: "ACTIVE" } }),
    db.student.count({ where: { schoolId, status: "ACTIVE" } }),
    db.class.findMany({ where: { schoolId }, include: { _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } }, orderBy: { level: "asc" } }),
    db.stream.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
  ]);

  const enrollmentByClass = classes.map((c) => ({
    id: c.id,
    name: c.name,
    students: c._count.enrollments,
  }));

  const recentResults = can(session, "results.view")
    ? await db.result.findMany({
        where: { schoolId },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: { student: { select: { firstName: true, lastName: true, admissionNumber: true } }, exam: { select: { name: true } }, examSubject: { include: { subject: true } } },
      })
    : [];

  const [upcomingEvents, recentNotices] = await Promise.all([
    db.event.findMany({
      where: { schoolId, startDate: { gte: today } },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
    db.notice.findMany({
      where: { schoolId, expiryDate: { gte: today }, publishDate: { lte: today } },
      orderBy: { publishDate: "desc" },
      take: 5,
    }),
  ]);

  let revenueThisTerm = 0;
  let unpaidCount = 0;
  let outstandingBalance = 0;
  let attendanceToday = 0;
  let attendanceTotal = 0;
  let paymentChart: { month: string; revenue: number }[] = [];

  const currentTerm = can(session, "payments.view")
    ? await db.term.findFirst({ where: { schoolId, isCurrent: true }, include: { academicYear: true } })
    : null;

  if (can(session, "payments.view")) {
    const academicYearStart = currentTerm?.academicYear?.startDate ?? startOfDay(today);
    const academicYearEnd = currentTerm?.academicYear?.endDate ?? endOfDay(today);
    const [paymentsAgg, monthRevenue] = await Promise.all([
      db.payment.aggregate({
        where: {
          schoolId,
          date: { gte: currentTerm?.startDate ?? startOfDay(today) },
        },
        _sum: { amount: true },
      }),
      db.$queryRaw<Array<{ month: string; revenue: number }>>`
        SELECT to_char(date_trunc('month', "date"), 'Mon') AS month,
               COALESCE(SUM(amount), 0)::float8 AS revenue
        FROM payment
        WHERE "schoolId" = ${schoolId}
          AND "date" >= ${academicYearStart}
          AND "date" <= ${academicYearEnd}
        GROUP BY 1
      `,
    ]);
    revenueThisTerm = Number(paymentsAgg._sum.amount ?? 0);
    const monthTotals = new Map(monthRevenue.map((m) => [m.month, Number(m.revenue)]));
    const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    paymentChart = monthsOrder.map((m) => ({ month: m, revenue: monthTotals.get(m) ?? 0 }));
  }

  if (can(session, "invoices.view")) {
    const [invoiceCount, itemsAgg, discountAgg, paidAgg] = await Promise.all([
      db.invoice.count({ where: { schoolId, status: { in: ["UNPAID", "OVERDUE"] } } }),
      db.invoiceItem.aggregate({
        where: { invoice: { schoolId, status: { in: ["UNPAID", "OVERDUE"] } } },
        _sum: { amount: true },
      }),
      db.invoice.aggregate({
        where: { schoolId, status: { in: ["UNPAID", "OVERDUE"] } },
        _sum: { discount: true },
      }),
      db.payment.aggregate({
        where: { invoice: { schoolId, status: { in: ["UNPAID", "OVERDUE"] } } },
        _sum: { amount: true },
      }),
    ]);
    unpaidCount = invoiceCount;
    outstandingBalance = Math.max(
      0,
      Number(itemsAgg._sum.amount ?? 0) -
        Number(discountAgg._sum.discount ?? 0) -
        Number(paidAgg._sum.amount ?? 0)
    );
  }

  if (can(session, "attendance.view")) {
    const [total, present] = await Promise.all([
      db.attendance.count({
        where: { schoolId, date: { gte: startOfDay(today), lte: endOfDay(today) } },
      }),
      db.attendance.count({
        where: {
          schoolId,
          date: { gte: startOfDay(today), lte: endOfDay(today) },
          status: { in: ["PRESENT", "EXCUSED"] },
        },
      }),
    ]);
    attendanceTotal = total;
    attendanceToday = present;
  }

  const permissionGranted = (perms: string[]) => perms.some((p) => can(session, p));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${session.user.name?.split(" ")[0] ?? "there"}`}
        description={session.user.schoolName ?? "Overview of your school today"}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<UsersIcon className="size-4" />}
          label="Students"
          value={formatNumber(studentsCount)}
          sub={`${formatNumber(activeStudents)} active`}
          href="/students"
        />
        <StatCard
          icon={<GraduationCapIcon className="size-4" />}
          label="Teachers"
          value={formatNumber(teachersCount)}
          sub={`${formatNumber(streams.length)} class streams`}
          href="/teachers"
        />
        <StatCard
          icon={<UserCogIcon className="size-4" />}
          label="Staff"
          value={formatNumber(staffCount)}
          sub="Non-teaching"
          href="/staff"
        />
        {can(session, "attendance.view") ? (
          <StatCard
            icon={<CalendarDaysIcon className="size-4" />}
            label="Attendance today"
            value={attendanceTotal > 0 ? `${Math.round((attendanceToday / attendanceTotal) * 100)}%` : "—"}
            sub={`${formatNumber(attendanceTotal)} record${attendanceTotal === 1 ? "" : "s"} marked`}
            href="/attendance"
          />
        ) : null}
        {can(session, "payments.view") ? (
          <StatCard
            icon={<WalletIcon className="size-4" />}
            label="Revenue (term)"
            value={formatMoney(revenueThisTerm)}
            sub="Payments this term"
            href="/payments"
          />
        ) : null}
        {can(session, "invoices.view") ? (
          <StatCard
            icon={<ReceiptIcon className="size-4" />}
            label="Outstanding balance"
            value={formatMoney(outstandingBalance)}
            sub={unpaidCount > 0 ? `${formatNumber(unpaidCount)} unpaid / overdue` : "No outstanding invoices"}
            href="/invoices?status=OVERDUE"
          />
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {can(session, "payments.view") ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue collections</CardTitle>
              <CardDescription>Payments received this calendar year</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart data={paymentChart} />
            </CardContent>
          </Card>
        ) : null}

        <Card className={can(session, "payments.view") ? undefined : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>Things that need attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {permissionGranted(["attendance.view", "payments.view", "invoices.view"]) ? (
              <>
                {can(session, "attendance.view") ? (
                  <AlertItem
                    icon={<AlertTriangleIcon className="size-4 text-amber-600" />}
                    text={attendanceTotal > 0 ? `${attendanceTotal} attendance records today` : "No attendance marked yet today"}
                    href="/attendance"
                  />
                ) : null}
                {can(session, "invoices.view") ? (
                  <AlertItem
                    icon={<WalletIcon className="size-4 text-rose-600" />}
                    text={`${unpaidCount} unpaid / overdue invoice${unpaidCount === 1 ? "" : "s"}`}
                    href="/invoices?status=OVERDUE"
                  />
                ) : null}
                {can(session, "payments.view") ? (
                  <AlertItem
                    icon={<WalletIcon className="size-4 text-emerald-600" />}
                    text={`${formatMoney(revenueThisTerm)} collected this term`}
                    href="/payments"
                  />
                ) : null}
              </>
            ) : null}

            {recentResults.length > 0 && can(session, "results.view") ? (
              <>
                <div className="pt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Latest marks
                </div>
                {recentResults.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <AwardIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {r.student.firstName} {r.student.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.examSubject.subject.name} · {r.exam.name}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-sm font-semibold tabular-nums text-primary">
                      {r.grade ?? `${Number(r.percentage)}%`}
                    </span>
                  </div>
                ))}
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Enrolment by class</CardTitle>
            <CardDescription>Active students per class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enrollmentByClass.map((c) => (
                <Link key={c.id} href={`/classes/${c.id}`} className="group block">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium transition-colors group-hover:text-primary">{c.name}</span>
                    <span className="text-muted-foreground">{formatNumber(c.students)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-colors group-hover:bg-primary/80"
                      style={{ width: `${classes.length ? Math.round((c.students / Math.max(...enrollmentByClass.map((x) => x.students), 1)) * 100) : 0}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Upcoming events</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {upcomingEvents.length ? (
              <div className="space-y-3">
                {upcomingEvents.map((e) => (
                  <div key={e.id} className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarDaysIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.startDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No upcoming events</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Latest notices</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentNotices.length ? (
              <div className="space-y-3">
                {recentNotices.map((n) => (
                  <div key={n.id} className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <MegaphoneIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.audience === "CLASS" ? "Class notice" : n.audience.replace(/_/g, " ").toLowerCase()} · {timeAgo(n.publishDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No notices yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {isSchoolAdmin && can(session, "results.view") ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentResults.length ? (
              <div className="space-y-2">
                {recentResults.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="text-sm">
                      <span className="font-medium">
                        {r.student.firstName} {r.student.lastName}
                      </span>{" "}
                      scored {r.grade ?? `${r.percentage}%`} in {r.examSubject.subject.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{timeAgo(r.updatedAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No activity yet</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function AlertItem({ icon, text, href }: { icon: React.ReactNode; text: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/60"
    >
      {icon}
      <span className="min-w-0 flex-1 truncate text-sm">{text}</span>
      <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
