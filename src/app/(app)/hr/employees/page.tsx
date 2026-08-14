import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseIcon, UsersIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults, formatMoney, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Employees" };

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (!can(session, "hr.view")) redirect("/dashboard");
  const schoolId = getSchoolId(session);
  const { page, perPage, search, status, skip } = paginationDefaults(await searchParams);

  const where = {
    schoolId,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { position: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status ? { status: status as never } : {}),
  };

  const [employees, total, activeCount] = await Promise.all([
    db.employee.findMany({
      where,
      orderBy: [{ lastName: "asc" }],
      skip,
      take: perPage,
      include: { department: true },
    }),
    db.employee.count({ where }),
    db.employee.count({ where: { schoolId, status: "ACTIVE" } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Employees" description="All staff under HR management">
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<UsersIcon className="size-4" />}
          label="Employees"
          value={formatNumber(activeCount)}
          sub="Active"
          href="/hr/employees"
        />
        <StatCard
          icon={<BriefcaseIcon className="size-4" />}
          label="Total records"
          value={formatNumber(total)}
          sub="Including on-leave and departed"
          href="/hr/employees"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search name or position…" />
        {["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"].map((s) => (
          <Link
            key={s}
            href={`/hr/employees?status=${s}`}
            className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors ${
              status === s ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"
            }`}
          >
            {s.replace(/_/g, " ").toLowerCase()}
          </Link>
        ))}
      </div>

      {employees.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback>{initials(`${e.firstName} ${e.lastName}`)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {e.firstName} {e.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{e.position ?? "—"}</TableCell>
                  <TableCell>{e.department?.name ?? "—"}</TableCell>
                  <TableCell>{e.phone ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(e.salary ?? 0)}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No employees found"
          description="Employee records managed through HR."
          icon={<UsersIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />
    </div>
  );
}
