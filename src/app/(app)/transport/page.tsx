import { BusIcon, RouteIcon, UsersIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getSchoolId } from "@/lib/server-helpers";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
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

export const metadata = { title: "Transport" };

export default async function TransportPage() {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);

  const [vehicles, routes, activeVehicles] = await Promise.all([
    db.vehicle.findMany({ where: { schoolId }, orderBy: { registration: "asc" } }),
    db.route.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      include: { vehicle: { select: { registration: true } } },
    }),
    db.vehicle.count({ where: { schoolId, status: "ACTIVE" } }),
  ]);

  const totalCapacity = routes.reduce((s, r) => s + r.capacity, 0);

  return (
    <div className="space-y-4">
      <PageHeader title="Transport" description="Fleet and routes" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={<BusIcon className="size-4" />}
          label="Vehicles"
          value={formatNumber(vehicles.length)}
          sub={`${formatNumber(activeVehicles)} active`}
          href="/transport"
        />
        <StatCard
          icon={<RouteIcon className="size-4" />}
          label="Routes"
          value={formatNumber(routes.length)}
          sub="Scheduled journeys"
          href="/transport"
        />
        <StatCard
          icon={<UsersIcon className="size-4" />}
          label="Route capacity"
          value={formatNumber(totalCapacity)}
          sub="Seats across all routes"
          href="/transport"
        />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Vehicles</h2>
        </div>
        {vehicles.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-sm font-medium">{v.registration}</TableCell>
                  <TableCell className="capitalize">{v.type ?? "—"}</TableCell>
                  <TableCell className="font-mono">{v.capacity}</TableCell>
                  <TableCell>{v.driverName ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={v.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No vehicles registered"
            description="Add vehicles to build your school fleet."
            icon={<BusIcon className="size-6" />}
          />
        )}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Routes</h2>
        </div>
        {routes.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Capacity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.vehicle?.registration ?? "—"}</TableCell>
                  <TableCell>{r.driverName ?? "—"}</TableCell>
                  <TableCell className="font-mono">{r.capacity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No routes defined"
            description="Create routes to manage pick-up and drop-off journeys."
            icon={<RouteIcon className="size-6" />}
          />
        )}
      </div>
    </div>
  );
}
