import Link from "next/link";
import { redirect } from "next/navigation";
import { BanknoteIcon, WalletIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults, formatMoney, formatDate, fullName } from "@/lib/format";
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

export const metadata = { title: "Payroll" };

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (!can(session, "payroll.view")) redirect("/dashboard");
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

  const [payrolls, total, netTotal, paidCount] = await Promise.all([
    db.payroll.findMany({
      where,
      orderBy: [{ periodEnd: "desc" }],
      skip,
      take: perPage,
      include: {
        employee: { select: { firstName: true, lastName: true, position: true } },
      },
    }),
    db.payroll.count({ where }),
    db.payroll.aggregate({ where: { schoolId }, _sum: { netSalary: true } }),
    db.payroll.count({ where: { schoolId, status: "PAID" } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Payroll" description="Employee pay records" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={<BanknoteIcon className="size-4" />}
          label="Net payroll"
          value={formatMoney(netTotal._sum.netSalary ?? 0)}
          sub="Total net across all records"
          href="/hr/payroll"
          tone="text-emerald-600"
        />
        <StatCard
          icon={<WalletIcon className="size-4" />}
          label="Paid runs"
          value={String(paidCount)}
          sub="Completed payroll runs"
          href="/hr/payroll?status=PAID"
        />
        <StatCard
          icon={<BanknoteIcon className="size-4" />}
          label="Records"
          value={String(total)}
          sub="All payroll entries"
          href="/hr/payroll"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search employee…" />
        {["DRAFT", "PAID", "CANCELLED"].map((s) => (
          <Link
            key={s}
            href={`/hr/payroll?status=${s}`}
            className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors ${
              status === s ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"
            }`}
          >
            {s.toLowerCase()}
          </Link>
        ))}
      </div>

      {payrolls.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{fullName(p.employee.firstName, null, p.employee.lastName)}</p>
                      {p.employee.position ? (
                        <p className="text-xs text-muted-foreground">{p.employee.position}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(p.basicSalary)}</TableCell>
                  <TableCell className="text-right font-mono font-medium">{formatMoney(p.netSalary)}</TableCell>
                  <TableCell>{p.paidDate ? formatDate(p.paidDate) : "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No payroll records"
          description="Payroll runs will appear here."
          icon={<BanknoteIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />
    </div>
  );
}
