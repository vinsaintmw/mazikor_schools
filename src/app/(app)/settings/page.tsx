import { Building2Icon, CreditCardIcon, CalendarDaysIcon, GaugeIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { formatDate } from "@/lib/format";
import { titleCase, APP_NAME } from "@/lib/constants";
import { getEffectiveLimits } from "@/lib/limits";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { SchoolProfileForm, SchoolProfileView } from "@/components/settings/school-profile";

export const metadata = { title: "Settings" };

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

function LimitRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const unlimited = limit == null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return (
    <div className="py-2 text-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used.toLocaleString()} / {unlimited ? "Unlimited" : limit.toLocaleString()}
        </span>
      </div>
      {!unlimited ? (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
      ) : null}
    </div>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!can(session, "settings.view")) redirect("/dashboard");
  const schoolId = getSchoolId(session);

  const [school, academicYears, subscription, limits, studentCount, teacherCount, staffCount] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId } }),
    db.academicYear.findMany({
      where: { schoolId },
      orderBy: { startDate: "desc" },
      include: { terms: { orderBy: { termNumber: "asc" } } },
      take: 5,
    }),
    db.subscription.findUnique({ where: { schoolId }, include: { plan: true } }),
    getEffectiveLimits(schoolId),
    db.student.count({ where: { schoolId } }),
    db.teacher.count({ where: { schoolId } }),
    db.staff.count({ where: { schoolId } }),
  ]);

  if (!school) {
    return (
      <EmptyState
        title="School profile missing"
        description="No school record was found for this account."
        icon={<Building2Icon className="size-6" />}
      />
    );
  }

  const canManageSettings = session.user.permissions?.includes("settings.manage") ?? false;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description={session.user.schoolName ?? APP_NAME} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Building2Icon className="size-4" />
              School profile
            </CardTitle>
            <CardDescription>Name, contact details and branding shown across the platform</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {canManageSettings ? (
              <SchoolProfileForm
                school={{
                  name: school.name,
                  motto: school.motto,
                  address: school.address,
                  phone: school.phone,
                  email: school.email,
                  website: school.website,
                  registrationNumber: school.registrationNumber,
                  currency: school.currency,
                  currencySymbol: school.currencySymbol,
                  logo: school.logo,
                  primaryColor: school.primaryColor,
                  secondaryColor: school.secondaryColor,
                }}
              />
            ) : (
              <SchoolProfileView
                school={{
                  name: school.name,
                  motto: school.motto,
                  address: school.address,
                  phone: school.phone,
                  email: school.email,
                  website: school.website,
                  registrationNumber: school.registrationNumber,
                  currency: school.currency,
                  currencySymbol: school.currencySymbol,
                  logo: school.logo,
                  primaryColor: school.primaryColor,
                  secondaryColor: school.secondaryColor,
                }}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="size-4" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {subscription ? (
              <>
                <InfoRow label="Plan" value={subscription.plan.name} />
                <div className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={subscription.status} />
                </div>
                <InfoRow label="Started" value={formatDate(subscription.startDate)} />
                <InfoRow label="Renewal" value={subscription.renewalDate ? formatDate(subscription.renewalDate) : null} />
              </>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">No active subscription.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <GaugeIcon className="size-4" />
              Plan usage
            </CardTitle>
            <CardDescription>Current usage against your plan&apos;s limits</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <LimitRow label="Students" used={studentCount} limit={limits.maxStudents} />
            <LimitRow label="Teachers" used={teacherCount} limit={limits.maxTeachers} />
            <LimitRow label="Staff" used={staffCount} limit={limits.maxStaff} />
            <div className="border-t pt-2">
              <InfoRow label="Storage" value={limits.maxStorageGB != null ? `${limits.maxStorageGB} GB` : "Unlimited"} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <CalendarDaysIcon className="size-4" />
            Academic years & terms
          </CardTitle>
          <CardDescription>Recent academic structure for this school</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {academicYears.length ? (
            <div className="space-y-4">
              {academicYears.map((y) => (
                <div key={y.id}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {y.name}
                      {y.isCurrent ? <StatusBadge status="ACTIVE" className="ml-2">Current</StatusBadge> : null}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(y.startDate)} – {formatDate(y.endDate)}
                    </span>
                  </div>
                  {y.terms.length ? (
                    <div className="flex flex-wrap gap-2">
                      {y.terms.map((t) => (
                        <span key={t.id} className="rounded-lg border px-2.5 py-1 text-xs">
                          {titleCase(t.name)}
                          {t.isCurrent ? <span className="ml-1 text-primary">•</span> : null}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No terms defined.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No academic years defined yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
