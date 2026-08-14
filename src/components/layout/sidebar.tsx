"use client";

import { createElement } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PanelLeftIcon } from "lucide-react";
import { NAV_SECTIONS, type NavSection } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { iconFor, type IconName } from "@/lib/icons";
import { Button } from "@/components/ui/button";

function NavItem({
  item,
  collapsed,
  onNavigate,
  primaryColor,
}: {
  item: NavSection["items"][number];
  collapsed: boolean;
  onNavigate?: () => void;
  primaryColor?: string | null;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.title : undefined}
      aria-label={collapsed ? item.title : undefined}
      style={active && primaryColor ? { backgroundColor: primaryColor } : undefined}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
        collapsed && "w-9 justify-center px-0",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {createElement(iconFor(item.icon as IconName), { className: "size-4 shrink-0" })}
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );
}

export function SidebarNav({
  sections,
  collapsed,
  onNavigate,
  className,
  primaryColor,
}: {
  sections: NavSection[];
  collapsed: boolean;
  onNavigate?: () => void;
  className?: string;
  primaryColor?: string | null;
}) {
  return (
    <nav className={cn("flex flex-col gap-5 overflow-y-auto no-scrollbar px-3 py-3", className)}>
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          {!collapsed ? (
            <div className="px-2 pb-1 text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {section.title}
            </div>
          ) : (
            <div className="mx-2 mb-1 h-px bg-border" />
          )}
          {section.items.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
              primaryColor={primaryColor}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

export function SidebarBrand({
  schoolName,
  href,
  collapsed,
  onToggleCollapsed,
  showCollapseToggle = false,
  logo,
  primaryColor,
}: {
  schoolName: string;
  href: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  showCollapseToggle?: boolean;
  logo?: string | null;
  primaryColor?: string | null;
}) {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 border-b px-3",
        collapsed && "justify-center px-2"
      )}
    >
      <Link href={href} className="flex min-w-0 items-center gap-2" title={collapsed ? schoolName : undefined}>
        <span className="flex size-7 shrink-0 items-center justify-center">
          <Image
            src={logo || "/logo.png"}
            alt={`${schoolName} logo`}
            width={1024}
            height={1024}
            className="size-7 object-contain"
          />
        </span>
        {!collapsed && (
          <span className="truncate text-sm leading-tight font-semibold" style={primaryColor ? { color: primaryColor } : undefined}>
            {schoolName}
          </span>
        )}
      </Link>
      {showCollapseToggle && !collapsed ? (
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto"
          onClick={onToggleCollapsed}
          aria-label="Collapse sidebar"
        >
          <PanelLeftIcon className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}

export function SidebarFooter({ collapsed, primaryColor }: { collapsed: boolean; primaryColor?: string | null }) {
  const pathname = usePathname();
  const item = NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.href === "/settings") ?? {
    title: "Settings",
    href: "/settings",
    icon: "settings",
  };
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <div className="border-t p-2">
      <Link
        href={item.href}
        title={collapsed ? item.title : undefined}
        aria-label={collapsed ? item.title : undefined}
        style={active && primaryColor ? { backgroundColor: primaryColor } : undefined}
        className={cn(
          "flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
          collapsed && "w-9 justify-center px-0",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        {createElement(iconFor(item.icon as IconName), { className: "size-4 shrink-0" })}
        {!collapsed && <span className="truncate">{item.title}</span>}
      </Link>
      {!collapsed ? (
        <p className="mt-2 px-2.5 text-[10px] tracking-wide text-muted-foreground/60">
          Powered by Mazikor Schools
        </p>
      ) : null}
    </div>
  );
}
