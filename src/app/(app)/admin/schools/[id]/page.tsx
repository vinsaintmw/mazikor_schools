import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PencilIcon, ArrowLeftIcon, UsersIcon, GraduationCapIcon, CalendarDaysIcon, ShieldCheckIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { SetupLinkForm } from "@/components/admin/setup-link-form";
import { suspendOrActivateSchool } from "@/lib/actions/super-admin";

export const metadata = { title: "School" };

export default async function AdminSchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKey !== "super_admin") redirect("/dashboard");

  const { id } = await params;
  const school = await db.school.findUnique({
    where: { id },
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { students: true, users: true, academicYears: true } },
    },
  });
  if (!school) notFound();

  const [admin, latestInvitation] = await Promise.all([
    db.user.findFirst({
      where: { schoolId: school.id, role: { key: "school_admin" } },
      orderBy: { createdAt: "asc" },
    }),
    db.schoolInvitation.findFirst({
      where: { schoolId: school.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pendingInvite =
    latestInvitation && !latestInvitation.usedAt && !latestInvitation.revokedAt && latestInvitation.expiresAt > new Date();
  const adminCanLogin = admin?.emailVerified != null;

  return (
    <div className="space-y-4">
      <PageHeader
        title={school.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{school.slug}</span>
            <StatusBadge status={school.isActive ? "ACTIVE" : "SUSPENDED"} />
            {school.subscription ? (
              <StatusBadge status={school.subscription.status}>{school.subscription.status.toLowerCase()}</StatusBadge>
            ) : null}
          </span>
        }
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/schools">
            <ArrowLeftIcon className="size-3.5" /> Schools
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/schools/${school.id}/edit`}>
            <PencilIcon className="size-3.5" /> Edit
          </Link>
        </Button>
        <ActionForm
          action={suspendOrActivateSchool}
          successLabel={school.isActive ? "School suspended" : "School activated"}
          className="flex"
        >
          <input type="hidden" name="schoolId" value={school.id} />
          <SubmitButton variant="outline" size="sm" pendingLabel="Updating…">
            {school.isActive ? "Suspend" : "Activate"}
          </SubmitButton>
        </ActionForm>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>School information and contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {[
                ["School name", school.name],
                ["Slug", school.slug],
                ["Code", school.code],
                ["Type", school.type?.replace(/_/g, " ") ?? "—"],
                ["Registration number", school.registrationNumber ?? "—"],
                ["Motto", school.motto ?? "—"],
                ["Address", school.address ?? "—"],
                ["District", school.district ?? "—"],
                ["Region", school.region ?? "—"],
                ["Country", school.country ?? "—"],
                ["Phone", school.phone ?? "—"],
                ["Email", school.email ?? "—"],
                ["Website", school.website ?? "—"],
                ["Timezone", school.timezone?.replace(/_/g, " ") ?? "—"],
                ["Currency", `${school.currencySymbol} ${school.currency}`],
                ["Joined", formatDate(school.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-border/60 pb-2 last:border-0">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Current plan and billing status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {school.subscription ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="font-medium">{school.subscription.plan.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <StatusBadge status={school.subscription.status} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Renewal</p>
                      <p className="text-sm font-medium">{formatDate(school.subscription.renewalDate)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No subscription yet.</p>
              )}
              <Button variant="outline" size="sm" asChild className="mt-1">
                <Link href="/admin/subscriptions">Manage subscriptions</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>School size</CardTitle>
              <CardDescription>Current usage at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-3 gap-3">
                {[
                  ["Students", school._count.students, GraduationCapIcon],
                  ["Users", school._count.users, UsersIcon],
                  ["Academic years", school._count.academicYears, CalendarDaysIcon],
                ].map(([label, value, Icon]) => {
                  const IconComp = Icon as typeof UsersIcon;
                  return (
                    <div key={label as string} className="rounded-lg border bg-muted/40 p-3 text-center">
                      <IconComp className="mx-auto mb-1 size-4 text-muted-foreground" />
                      <dd className="text-lg font-semibold">{value as number}</dd>
                      <dt className="text-xs text-muted-foreground">{label as string}</dt>
                    </div>
                  );
                })}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4" /> School administrator
          </CardTitle>
          <CardDescription>
            {adminCanLogin
              ? `${admin?.name} has set their password and can sign in.`
              : "The administrator has not set their password yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {admin ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {[
                  ["Name", admin.name],
                  ["Email", admin.email],
                  ["Phone", admin.phone ?? "—"],
                  ["Status", adminCanLogin ? "Password set" : "Awaiting setup"],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-border/60 pb-2">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="text-sm font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="mb-2 text-sm font-medium">Setup link</p>
                <SetupLinkForm schoolId={school.id} adminEmail={admin.email} adminName={admin.name} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No school administrator found for this school. Add one through Users, then generate their setup link
                here.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/users">Go to Users</Link>
              </Button>
            </div>
          )}
          {pendingInvite ? (
            <p className="text-xs text-muted-foreground">
              A setup link was generated {formatDate(latestInvitation.createdAt)} and is still valid.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
