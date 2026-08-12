import { Building2Icon, CreditCardIcon, CalendarDaysIcon, MailIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getSchoolId } from "@/lib/server-helpers";
import { formatDate } from "@/lib/format";
import { titleCase, APP_NAME } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Settings" };

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);

  const [school, academicYears, subscription] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId } }),
    db.academicYear.findMany({
      where: { schoolId },
      orderBy: { startDate: "desc" },
      include: { terms: { orderBy: { termNumber: "asc" } } },
      take: 5,
    }),
    db.subscription.findUnique({ where: { schoolId }, include: { plan: true } }),
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description={session.user.schoolName ?? APP_NAME}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Building2Icon className="size-4" />
              School profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <InfoRow label="Name" value={school.name} />
            <InfoRow label="Code" value={school.code} />
            <InfoRow label="Registration" value={school.registrationNumber} />
            <InfoRow label="Motto" value={school.motto} />
            <InfoRow label="Address" value={school.address} />
            <InfoRow label="Currency" value={`${school.currency} (${school.currencySymbol})`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <MailIcon className="size-4" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <InfoRow label="Phone" value={school.phone} />
            <InfoRow label="Email" value={school.email} />
            <InfoRow label="Website" value={school.website} />
            <div className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={school.isActive ? "ACTIVE" : "SUSPENDED"} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="size-4" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
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
