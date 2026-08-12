import { BoxesIcon, PackageIcon, WalletIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults, formatMoney, formatNumber } from "@/lib/format";
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

export const metadata = { title: "Inventory" };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);
  const { page, perPage, search, skip } = paginationDefaults(await searchParams);

  const where = {
    schoolId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
            { location: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total, itemCount, totalQty, totalValue] = await Promise.all([
    db.inventoryItem.findMany({ where, orderBy: [{ name: "asc" }], skip, take: perPage }),
    db.inventoryItem.count({ where }),
    db.inventoryItem.count({ where: { schoolId } }),
    db.inventoryItem.aggregate({ where: { schoolId }, _sum: { quantity: true } }),
    db.inventoryItem.aggregate({ where: { schoolId }, _sum: { value: true } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Inventory" description="School equipment and supplies" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={<BoxesIcon className="size-4" />}
          label="Item types"
          value={formatNumber(itemCount)}
          sub="Tracked in inventory"
          href="/inventory"
        />
        <StatCard
          icon={<PackageIcon className="size-4" />}
          label="Total units"
          value={formatNumber(totalQty._sum.quantity ?? 0)}
          sub="Across all locations"
          href="/inventory"
        />
        <StatCard
          icon={<WalletIcon className="size-4" />}
          label="Asset value"
          value={formatMoney(totalValue._sum.value ?? 0)}
          sub="Estimated replacement cost"
          href="/inventory"
          tone="text-emerald-600"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search item, category or location…" />
      </div>

      {items.length ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell>{i.category}</TableCell>
                  <TableCell className="font-mono">{i.quantity}</TableCell>
                  <TableCell>
                    <StatusBadge status={i.condition} />
                  </TableCell>
                  <TableCell>{i.location ?? "—"}</TableCell>
                  <TableCell className="font-mono">{formatMoney(i.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No inventory items"
          description="Record equipment and supplies to track school assets."
          icon={<BoxesIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />
    </div>
  );
}
