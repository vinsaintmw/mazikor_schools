import { redirect } from "next/navigation";
import { SchoolIcon } from "lucide-react";
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

export const metadata = { title: "Schools" };

export default async function AdminSchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKey !== "super_admin") redirect("/dashboard");
  const { page, perPage, search, skip } = paginationDefaults(await searchParams);

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [schools, total] = await Promise.all([
    db.school.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { students: true, users: true } },
      },
    }),
    db.school.count({ where }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Schools" description="All institutions on the platform" />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search name, code or email…" />
      </div>

      {schools.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email ?? "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.code}</TableCell>
                  <TableCell>{s.subscription?.plan.name ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.isActive ? "ACTIVE" : "SUSPENDED"} />
                  </TableCell>
                  <TableCell className="font-mono">{s._count.students}</TableCell>
                  <TableCell className="font-mono">{s._count.users}</TableCell>
                  <TableCell className="text-xs">{formatDate(s.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No schools found"
          description="Schools register through the platform onboarding flow."
          icon={<SchoolIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />
    </div>
  );
}
