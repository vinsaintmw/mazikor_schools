import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCardIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { paginationDefaults, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
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

export const metadata = { title: "Subscriptions" };

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKey !== "super_admin") redirect("/dashboard");
  const { page, perPage, search, status, skip } = paginationDefaults(await searchParams);

  const where = {
    ...(search
      ? { school: { name: { contains: search, mode: "insensitive" as const } } }
      : {}),
    ...(status ? { status: status as never } : {}),
  };

  const [subscriptions, total] = await Promise.all([
    db.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      include: { school: { select: { name: true, code: true } }, plan: { select: { name: true } } },
    }),
    db.subscription.count({ where }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Subscriptions" description="School subscription records" />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search school…" />
        {["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"].map((s) => (
          <Link
            key={s}
            href={`/admin/subscriptions?status=${s}`}
            className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors ${
              status === s ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"
            }`}
          >
            {s.toLowerCase()}
          </Link>
        ))}
      </div>

      {subscriptions.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Renewal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{s.school.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{s.school.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>{s.plan.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(s.startDate)}</TableCell>
                  <TableCell className="text-xs">{s.renewalDate ? formatDate(s.renewalDate) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No subscriptions found"
          description="Subscriptions appear once schools sign up."
          icon={<CreditCardIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />
    </div>
  );
}
