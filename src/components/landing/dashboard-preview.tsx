import {
  UsersIcon,
  GraduationCapIcon,
  WalletIcon,
  AwardIcon,
  LayoutDashboardIcon,
  CalendarCheckIcon,
  FileTextIcon,
  SettingsIcon,
  ArrowUpRightIcon,
  TrendingUpIcon,
  MegaphoneIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";

const SIDEBAR = [
  { icon: LayoutDashboardIcon, label: "Dashboard", active: true },
  { icon: UsersIcon, label: "Students" },
  { icon: GraduationCapIcon, label: "Teachers" },
  { icon: CalendarCheckIcon, label: "Attendance" },
  { icon: FileTextIcon, label: "Results" },
  { icon: WalletIcon, label: "Fees" },
  { icon: SettingsIcon, label: "Settings" },
];

const STATS = [
  { icon: UsersIcon, label: "Students", value: "1,247", sub: "1,201 active", tone: "text-primary bg-primary/10" },
  { icon: CalendarCheckIcon, label: "Attendance today", value: "94.5%", sub: "892 of 944 present", tone: "text-emerald-600 bg-emerald-500/10" },
  { icon: WalletIcon, label: "Fees collected", value: "MK 4.8M", sub: "Term 2 to date", tone: "text-primary bg-primary/10" },
  { icon: AwardIcon, label: "Average score", value: "82%", sub: "B (Very good)", tone: "text-amber-600 bg-amber-500/10" },
];

const REVENUE = [32, 44, 38, 52, 48, 62, 58, 74, 68, 82, 78, 92];

const LATEST_MARKS = [
  { name: "Chisomo Banda", subject: "Mathematics", score: "A", initials: "CB" },
  { name: "Tapiwa Mwale", subject: "English", score: "B", initials: "TM" },
  { name: "Ruth Phiri", subject: "Physics", score: "A", initials: "RP" },
  { name: "Daniel Nyirenda", subject: "Biology", score: "C", initials: "DN" },
];

const ENROLMENT = [
  { name: "Form 1", students: 320 },
  { name: "Form 2", students: 305 },
  { name: "Form 3", students: 288 },
  { name: "Form 4", students: 240 },
];

function RevenueChartPreview() {
  const max = Math.max(...REVENUE);
  const points = REVENUE.map((v, i) => `${(i / (REVENUE.length - 1)) * 100},${100 - (v / max) * 80}`);
  const areaPoints = `0,100 ${points.join(" ")} 100,100`;
  return (
    <div className="relative aspect-[2/1] w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full" aria-hidden="true">
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#revFill)" />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-foreground/5">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-rose-400/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 hidden rounded-md bg-muted px-2.5 py-0.5 text-xs text-muted-foreground sm:block">
          dashboard.mazikor.com
        </span>
      </div>

      <div className="flex">
        <aside className="hidden w-40 shrink-0 border-r bg-muted/20 p-2 md:block" aria-hidden="true">
          <div className="mb-2 px-2 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Overview
          </div>
          <div className="space-y-0.5">
            {SIDEBAR.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                  item.active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <item.icon className="size-3.5 shrink-0" />
                {item.label}
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Welcome back, Head Teacher</p>
              <p className="text-xs text-muted-foreground">Kamuzu Academy · Term 2, 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Today: 14 Aug 2026
              </span>
              <Avatar className="size-7" aria-hidden="true">
                <AvatarFallback>HT</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {STATS.map((stat) => (
              <Card key={stat.label} size="sm">
                <CardContent className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{stat.sub}</p>
                  </div>
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}>
                    <stat.icon className="size-4" />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5">
                  <TrendingUpIcon className="size-4 text-emerald-600" />
                  Fees collected this year
                </CardTitle>
                <CardDescription>Monthly payments across all classes</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChartPreview />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Latest marks</CardTitle>
                <CardDescription>Recently recorded results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {LATEST_MARKS.map((m) => (
                  <div key={m.name} className="flex items-center gap-2.5">
                    <Avatar className="size-8" aria-hidden="true">
                      <AvatarFallback>{m.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.subject}</p>
                    </div>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-semibold tabular-nums text-primary">
                      {m.score}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Enrolment by class</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ENROLMENT.map((c) => (
                  <div key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground tabular-nums">{c.students}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round((c.students / 320) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5">
                  <MegaphoneIcon className="size-4 text-primary" />
                  Latest notices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  { title: "Term 2 exam timetable released", tag: "EVERYONE" },
                  { title: "Staff meeting — Friday 09:00", tag: "TEACHERS" },
                  { title: "Parent-teacher conference booking open", tag: "PARENTS" },
                ].map((n) => (
                  <div key={n.title} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <MegaphoneIcon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <div className="mt-1">
                        <StatusBadge status={n.tag} className="px-1.5 py-0 text-[10px]">
                          {n.tag.replace(/_/g, " ").toLowerCase()}
                        </StatusBadge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <ArrowUpRightIcon className="size-4 text-emerald-600" />
              <span className="font-medium">Realtime overview</span>
              <span className="hidden text-muted-foreground sm:inline">
                — attendance, fees and results update as you record them.
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
