"use client";

import { usePathname } from "next/navigation";
import { MenuIcon, MonitorIcon, MoonIcon, SearchIcon, SunIcon } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { BreadcrumbProvider, useBreadcrumbLabels } from "@/components/layout/breadcrumb-context";
import { SidebarBrand, SidebarNav, SidebarFooter } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { useTheme } from "next-themes";
import { NAV_SECTIONS, type NavSection } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import type { Session } from "next-auth";

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const mounted = useThemeMounted();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          {mounted && theme === "dark" ? (
            <MoonIcon className="size-4.5" />
          ) : mounted && theme === "system" ? (
            <MonitorIcon className="size-4.5" />
          ) : (
            <SunIcon className="size-4.5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("light")} className={theme === "light" ? "bg-muted" : undefined}>
          <SunIcon className="size-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className={theme === "dark" ? "bg-muted" : undefined}>
          <MoonIcon className="size-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className={theme === "system" ? "bg-muted" : undefined}>
          <MonitorIcon className="size-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function useThemeMounted() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  return mounted;
}

export type AppShellSchool = {
  name: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
};

export function AppShell({ session, school, children }: { session: Session; school?: AppShellSchool | null; children: React.ReactNode }) {
  return (
    <BreadcrumbProvider>
      <AppShellInner session={session} school={school}>
        {children}
      </AppShellInner>
    </BreadcrumbProvider>
  );
}

function AppShellInner({
  session,
  school,
  children,
}: {
  session: Session;
  school?: AppShellSchool | null;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storedCollapsed, setStoredCollapsed] = useState<boolean | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const pathname = usePathname();
  const labels = useBreadcrumbLabels();
  const isAdminArea = pathname.startsWith("/admin");

  if (storedCollapsed === null && typeof window !== "undefined") {
    setStoredCollapsed(window.localStorage.getItem("sidebar-collapsed") === "1");
  }
  const isCollapsed = storedCollapsed ?? false;

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setSidebarOpen(false);
  }

  useEffect(() => {
    window.localStorage.setItem("sidebar-collapsed", isCollapsed ? "1" : "0");
  }, [isCollapsed]);

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

  const brandHref = isAdminArea ? "/admin" : "/dashboard";
  const schoolName = school?.name ?? session.user?.schoolName ?? "Mazikor Schools";
  const primaryColor = isAdminArea ? null : school?.primaryColor ?? null;

  return (
    <div
      className="flex min-h-screen bg-muted/30"
      style={
        {
          "--school-primary": school?.primaryColor ?? undefined,
          "--school-secondary": school?.secondaryColor ?? undefined,
        } as React.CSSProperties
      }
    >
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r bg-sidebar transition-[width] duration-200 lg:block",
          isCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        <SidebarBrand
          schoolName={schoolName}
          href={brandHref}
          collapsed={isCollapsed}
          onToggleCollapsed={() => setStoredCollapsed((c) => !(c ?? false))}
          showCollapseToggle
          logo={school?.logo ?? null}
          primaryColor={primaryColor}
        />
        <SidebarNav sections={sections} collapsed={isCollapsed} className="pb-20" primaryColor={primaryColor} />
        <div className="absolute inset-x-0 bottom-0">
          <SidebarFooter collapsed={isCollapsed} primaryColor={primaryColor} />
        </div>
      </aside>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[padding] duration-200",
          isCollapsed ? "lg:pl-[68px]" : "lg:pl-64"
        )}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <MenuIcon className="size-4.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(85vw,20rem)] gap-0 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarBrand
                  schoolName={schoolName}
                  href={brandHref}
                  logo={school?.logo ?? null}
                  primaryColor={primaryColor}
                />
                <SidebarNav
                  sections={sections}
                  collapsed={false}
                  onNavigate={() => setSidebarOpen(false)}
                  className="flex-1 pb-20"
                  primaryColor={primaryColor}
                />
                <div className="absolute inset-x-0 bottom-0">
                  <SidebarFooter collapsed={false} primaryColor={primaryColor} />
                </div>
              </SheetContent>
            </Sheet>
            <Breadcrumb pathname={pathname} labels={labels} />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
              aria-label="Search"
            >
              <SearchIcon className="size-4 shrink-0" />
              <span className="flex-1 truncate text-left">Search…</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Ctrl K
              </kbd>
            </button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setCommandOpen(true)} aria-label="Search">
              <SearchIcon className="size-4.5" />
            </Button>
            {!isAdminArea ? <NotificationBell schoolId={session.user?.schoolId ?? null} /> : null}
            <ThemeSwitcher />
            <UserMenu session={session} />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        isAdminArea={isAdminArea}
        canView={canView}
      />
    </div>
  );
}
