"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MenuIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore, useState } from "react";
import { NAV_SECTIONS, type NavSection } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { iconFor, type IconName } from "@/lib/icons";
import type { Session } from "next-auth";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {mounted && theme === "dark" ? <SunIcon className="size-4.5" /> : <MoonIcon className="size-4.5" />}
    </Button>
  );
}

function NavList({ sections, onNavigate }: { sections: NavSection[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {section.title}
          </div>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = iconFor(item.icon as IconName);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ session, children }: { session: Session; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setSidebarOpen(false);
  }

  const canView = (permission?: string) => {
    if (!permission) return true;
    if (session.user?.roleKey === "super_admin") return true;
    return (session.user?.permissions ?? []).includes(permission);
  };

  const sections: NavSection[] = isAdminArea
    ? [
        {
          title: "Platform",
          items: [
            { title: "Overview", href: "/admin", icon: "layout-dashboard" },
            { title: "Schools", href: "/admin/schools", icon: "school" },
            { title: "Plans", href: "/admin/plans", icon: "package" },
            { title: "Subscriptions", href: "/admin/subscriptions", icon: "credit-card" },
            { title: "Users", href: "/admin/users", icon: "users" },
            { title: "Activity", href: "/admin/activity", icon: "activity" },
            { title: "Settings", href: "/admin/settings", icon: "settings" },
          ],
        },
      ]
    : NAV_SECTIONS.map((section) => ({
        title: section.title,
        items: section.items.filter((i) => canView(i.permission)),
      })).filter((s) => s.items.length > 0);

  const brand = (
    <Link href={isAdminArea ? "/admin" : "/dashboard"} className="flex items-center gap-2 px-4 py-4">
      <span className="flex size-8 shrink-0 items-center justify-center">
        <Image
          src="/logo.png"
          alt={`${session.user?.schoolName ?? "Mazikor Schools"} logo`}
          width={1024}
          height={1024}
          className="size-8 object-contain"
        />
      </span>
      <span className="text-sm leading-tight font-semibold">
        {session.user?.schoolName ?? "Mazikor Schools"}
      </span>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-background lg:block">
        {brand}
        <NavList sections={sections} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <MenuIcon className="size-4.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-60 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                {brand}
                <NavList sections={sections} onNavigate={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="text-sm font-medium text-muted-foreground">
              {pathname === "/dashboard" ? "Overview" : " "}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!isAdminArea ? <NotificationBell schoolId={session.user?.schoolId ?? null} /> : null}
            <ThemeToggle />
            <UserMenu session={session} />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
