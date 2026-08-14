import { LibraryIcon, BookOpenIcon, ClockIcon, AlertTriangleIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults, formatDate, fullName } from "@/lib/format";
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

export const metadata = { title: "Library" };

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (!can(session, "library.view")) redirect("/dashboard");
  const schoolId = getSchoolId(session);
  const { page, perPage, search, skip } = paginationDefaults(await searchParams);

  const where = {
    schoolId,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { author: { contains: search, mode: "insensitive" as const } },
            { isbn: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [books, total, titles, bookCount, availableCount, activeLoans, overdueLoans] = await Promise.all([
    db.book.findMany({ where, orderBy: [{ title: "asc" }], skip, take: perPage }),
    db.book.count({ where }),
    db.book.count({ where: { schoolId } }),
    db.book.aggregate({ where: { schoolId }, _sum: { quantity: true } }),
    db.book.aggregate({ where: { schoolId }, _sum: { available: true } }),
    db.bookLoan.count({ where: { schoolId, status: "BORROWED" } }),
    db.bookLoan.count({ where: { schoolId, status: "OVERDUE" } }),
  ]);

  const recentLoans = await db.bookLoan.findMany({
    where: { schoolId },
    orderBy: { borrowDate: "desc" },
    take: 8,
    include: {
      book: { select: { title: true } },
      student: { select: { firstName: true, lastName: true, admissionNumber: true } },
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Library" description="Books and loan records" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<LibraryIcon className="size-4" />}
          label="Total books"
          value={String(bookCount._sum.quantity ?? 0)}
          sub={`${titles} titles in catalogue`}
          href="/library"
        />
        <StatCard
          icon={<BookOpenIcon className="size-4" />}
          label="Available"
          value={String(availableCount._sum.available ?? 0)}
          sub="Ready to borrow"
          href="/library"
        />
        <StatCard
          icon={<ClockIcon className="size-4" />}
          label="Active loans"
          value={String(activeLoans)}
          sub="Borrowed now"
          href="/library"
        />
        <StatCard
          icon={<AlertTriangleIcon className="size-4" />}
          label="Overdue"
          value={String(overdueLoans)}
          sub={overdueLoans ? "Requires follow-up" : "All clear"}
          href="/library"
          tone={overdueLoans ? "text-rose-600" : "text-primary"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search title, author or ISBN…" />
      </div>

      {books.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Shelf</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>{b.author ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{b.isbn ?? "—"}</TableCell>
                  <TableCell>{b.category ?? "—"}</TableCell>
                  <TableCell>{b.shelf ?? "—"}</TableCell>
                  <TableCell className="font-mono">{b.quantity}</TableCell>
                  <TableCell>
                    <StatusBadge status={b.available > 0 ? "ACTIVE" : "OUT"}>{b.available} available</StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No books found"
          description="Add books to the catalogue to start lending."
          icon={<LibraryIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />

      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Recent loans</h2>
        </div>
        {recentLoans.length ? (
          <div className="divide-y">
            {recentLoans.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{l.book.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {fullName(l.student.firstName, null, l.student.lastName)} · {l.student.admissionNumber}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatDate(l.borrowDate)}</span>
                  <StatusBadge status={l.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No loans yet</p>
        )}
      </div>
    </div>
  );
}
