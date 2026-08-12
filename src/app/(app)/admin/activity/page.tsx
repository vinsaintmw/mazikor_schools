import { redirect } from "next/navigation";
import { ActivityIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { paginationDefaults, formatDate, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
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

export const metadata = { title: "Activity" };

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleKey !== "super_admin") redirect("/dashboard");
  const { page, perPage, skip } = paginationDefaults(await searchParams);

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      include: { user: { select: { name: true } }, school: { select: { name: true } } },
    }),
    db.auditLog.count(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Activity" description="Audit log of platform actions" />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search…" />
      </div>

      {logs.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>School</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback>{initials(l.user?.name ?? "System")}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{l.user?.name ?? "System"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{l.action.toLowerCase()}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{l.entity}</p>
                      {l.entityId ? <p className="font-mono text-xs text-muted-foreground">{l.entityId}</p> : null}
                    </div>
                  </TableCell>
                  <TableCell>{l.school?.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{l.ip ?? "—"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-xs">{timeAgo(l.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(l.createdAt)}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No activity logged"
          description="Audit events will appear here as actions are performed."
          icon={<ActivityIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />
    </div>
  );
}
