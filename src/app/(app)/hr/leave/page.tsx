import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarOffIcon, ClockIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults, formatDate, fullName } from "@/lib/format";
import { getLabel, LEAVE_TYPES } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Leave" };

const LEAVE_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

export default async function LeavePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (!can(session, "leave.view")) redirect("/dashboard");
  const schoolId = getSchoolId(session);
  const { page, perPage, search, status, skip } = paginationDefaults(await searchParams);

  const where = {
    schoolId,
    ...(search
      ? {
          employee: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
    ...(status ? { status: status as never } : {}),
  };

  const [requests, total, pendingCount, approvedCount] = await Promise.all([
    db.leave.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: perPage,
      include: {
        employee: { select: { firstName: true, lastName: true, position: true } },
        approver: { select: { name: true } },
      },
    }),
    db.leave.count({ where }),
    db.leave.count({ where: { schoolId, status: "PENDING" } }),
    db.leave.count({ where: { schoolId, status: "APPROVED" } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Leave" description="Employee leave requests" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={<CalendarOffIcon className="size-4" />}
          label="Pending"
          value={String(pendingCount)}
          sub="Awaiting approval"
          href="/hr/leave?status=PENDING"
          tone={pendingCount ? "text-amber-600" : "text-primary"}
        />
        <StatCard
          icon={<ClockIcon className="size-4" />}
          label="Approved"
          value={String(approvedCount)}
          sub="Approved requests"
          href="/hr/leave?status=APPROVED"
          tone="text-emerald-600"
        />
        <StatCard
          icon={<CalendarOffIcon className="size-4" />}
          label="Total requests"
          value={String(total)}
          sub="All time"
          href="/hr/leave"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search employee…" />
        {LEAVE_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/hr/leave?status=${s}`}
            className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors ${
              status === s ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"
            }`}
          >
            {s.toLowerCase()}
          </Link>
        ))}
      </div>

      {requests.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{fullName(l.employee.firstName, null, l.employee.lastName)}</p>
                      {l.employee.position ? (
                        <p className="text-xs text-muted-foreground">{l.employee.position}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{getLabel(l.type, LEAVE_TYPES)}</TableCell>
                  <TableCell>{formatDate(l.startDate)}</TableCell>
                  <TableCell>{formatDate(l.endDate)}</TableCell>
                  <TableCell className="font-mono">{l.days}</TableCell>
                  <TableCell>
                    <StatusBadge status={l.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No leave requests"
          description="Employee leave requests will appear here."
          icon={<CalendarOffIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />
    </div>
  );
}
