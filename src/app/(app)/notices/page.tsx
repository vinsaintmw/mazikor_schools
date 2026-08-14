import { MegaphoneIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults, formatDate } from "@/lib/format";
import { NOTICE_AUDIENCES, getLabel } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { NoticeDialog } from "@/components/notices/notice-dialog";
import { createNotice, deleteNotice } from "@/lib/actions/school";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Notices" };

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (!can(session, "notices.view")) redirect("/dashboard");
  const schoolId = getSchoolId(session);
  const sp = await searchParams;
  const { page, perPage, search, skip } = paginationDefaults(sp);
  const audience = Array.isArray(sp.audience) ? sp.audience[0] : sp.audience ?? "";

  const where = {
    schoolId,
    ...(audience ? { audience: audience as never } : {}),
    ...(search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [notices, total, classes] = await Promise.all([
    db.notice.findMany({
      where,
      include: { class: true },
      orderBy: { publishDate: "desc" },
      skip,
      take: perPage,
    }),
    db.notice.count({ where }),
    db.class.findMany({ where: { schoolId }, orderBy: { level: "asc" } }),
  ]);

  const canManage = can(session, "notices.manage");
  const today = new Date();

  return (
    <div className="space-y-4">
      <PageHeader title="Notices" description="School announcements">
        {canManage ? (
          <NoticeDialog
            action={createNotice}
            classes={classes.map((c) => ({ id: c.id, name: c.name }))}
          />
        ) : null}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search notices…" />
        {NOTICE_AUDIENCES.map((a) => (
          <a
            key={a.value}
            href={`/notices?audience=${a.value}`}
            className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors ${
              audience === a.value ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"
            }`}
          >
            {a.label}
          </a>
        ))}
      </div>

      {notices.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.map((n) => {
                const expired = n.expiryDate && n.expiryDate < today;
                return (
                  <TableRow key={n.id} className={expired ? "opacity-60" : ""}>
                    <TableCell>
                      <p className="font-medium">{n.title}</p>
                      <p className="line-clamp-1 max-w-md text-xs text-muted-foreground">{n.content}</p>
                    </TableCell>
                    <TableCell>
                      {n.audience === "CLASS" ? `${getLabel(n.audience, NOTICE_AUDIENCES)}: ${n.class?.name ?? "—"}` : getLabel(n.audience, NOTICE_AUDIENCES)}
                    </TableCell>
                    <TableCell>{formatDate(n.publishDate)}</TableCell>
                    <TableCell>{n.expiryDate ? formatDate(n.expiryDate) : "—"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {canManage ? (
                          <DeleteButton
                            action={deleteNotice.bind(null, n.id)}
                            confirmTitle={`Delete "${n.title}"?`}
                            label=""
                            confirmDescription="This notice will be permanently removed."
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No notices found"
          description="Publish a notice to share announcements."
          icon={<MegaphoneIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />
    </div>
  );
}
