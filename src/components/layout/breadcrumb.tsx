"use client";

import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Overview",
  students: "Students",
  teachers: "Teachers",
  staff: "Staff",
  parents: "Parents",
  classes: "Classes",
  subjects: "Subjects",
  attendance: "Attendance",
  exams: "Examinations",
  results: "Results",
  "report-cards": "Report Cards",
  timetable: "Timetable",
  assignments: "Assignments",
  fees: "Fee Structures",
  invoices: "Invoices",
  payments: "Payments",
  expenses: "Expenses",
  finance: "Financial Reports",
  notices: "Notices",
  events: "Events",
  library: "Library",
  transport: "Transport",
  inventory: "Inventory",
  hr: "HR",
  reports: "Reports",
  settings: "Settings",
  admin: "Admin",
  schools: "Schools",
  plans: "Plans",
  subscriptions: "Subscriptions",
  users: "Users",
  activity: "Activity",
  new: "New",
  edit: "Edit",
  marks: "Marks",
};

function pathToBreadcrumbs(
  pathname: string,
  labels?: Record<string, string>
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [];
  let accumulated = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    accumulated += `/${segment}`;

    if (UUID_RE.test(segment)) {
      continue;
    }

    const key = labels?.[accumulated] ?? SEGMENT_LABELS[segment];
    const label =
      key ??
      segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    items.push({ label, href: accumulated });
  }

  if (items.length > 0) {
    const last = items[items.length - 1];
    delete last.href;
  }

  return items;
}

export function Breadcrumb({
  pathname,
  labels,
  className,
}: {
  pathname: string;
  labels?: Record<string, string>;
  className?: string;
}) {
  const items = pathToBreadcrumbs(pathname, labels);

  if (items.length === 0) return null;

  const last = items.length - 1;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex min-w-0 items-center gap-1 text-sm", className)}
    >
      {items.map((item, i) => (
        <span
          key={`${item.href ?? item.label}-${i}`}
          className={cn(
            "flex min-w-0 items-center gap-1",
            i === last && "min-w-0 flex-1"
          )}
        >
          {i > 0 && <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />}
          {item.href ? (
            <Link
              href={item.href}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span className="truncate font-medium text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
