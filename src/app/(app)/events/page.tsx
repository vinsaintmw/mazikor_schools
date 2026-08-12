import { PartyPopperIcon, MapPinIcon } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSchoolId } from "@/lib/server-helpers";
import { paginationDefaults, formatDate, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { EventDialog } from "@/components/events/event-dialog";
import { createEvent, deleteEvent } from "@/lib/actions/school";

export const metadata = { title: "Events" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const schoolId = getSchoolId(session);
  const { page, perPage, search, skip } = paginationDefaults(await searchParams);
  const today = new Date();

  const where = {
    schoolId,
    ...(search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { startDate: "asc" },
      skip,
      take: perPage,
    }),
    db.event.count({ where }),
  ]);

  const upcoming = events.filter((e) => e.startDate >= today);
  const past = events.filter((e) => e.startDate < today);
  const canManage = can(session, "events.manage");

  return (
    <div className="space-y-4">
      <PageHeader title="Events" description="School calendar events">
        {canManage ? <EventDialog action={createEvent} /> : null}
      </PageHeader>

      <SearchInput placeholder="Search events…" />

      {events.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((e) => (
            <EventCard key={e.id} event={e} canDelete={canManage} onDelete={deleteEvent} />
          ))}
          {past.map((e) => (
            <EventCard key={e.id} event={e} canDelete={canManage} onDelete={deleteEvent} past />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No events found"
          description="Add events to the school calendar."
          action={canManage ? { label: "New event", href: "/events" } : undefined}
          icon={<PartyPopperIcon className="size-6" />}
        />
      )}

      <Pagination page={page} perPage={perPage} total={total} />
    </div>
  );
}

function EventCard({
  event,
  canDelete,
  onDelete,
  past,
}: {
  event: { id: string; title: string; description: string | null; type: string; startDate: Date; endDate: Date | null; location: string | null; color: string | null };
  canDelete: boolean;
  onDelete: (id: string) => Promise<void>;
  past?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${past ? "opacity-60" : ""}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: event.color ?? "#1d4ed8" }}
        >
          <PartyPopperIcon className="size-4" />
        </div>
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {event.type.replace(/_/g, " ")}
        </span>
      </div>
      <h3 className="font-semibold">{event.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(event.startDate)}</p>
      {event.endDate ? <p className="text-xs text-muted-foreground">until {formatDate(event.endDate)}</p> : null}
      {event.location ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPinIcon className="size-3.5" />
          {event.location}
        </p>
      ) : null}
      {event.description ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p> : null}
      {canDelete ? (
        <div className="mt-3 flex justify-end">
          <DeleteButton action={onDelete.bind(null, event.id)} label="" confirmTitle={`Delete "${event.title}"?`} />
        </div>
      ) : null}
    </div>
  );
}
