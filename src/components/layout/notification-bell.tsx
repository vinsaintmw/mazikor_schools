"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, CheckCheckIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

interface Notif {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell({ schoolId }: { schoolId: string | null }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    let active = true;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items: Notif[] }) => {
        if (active) setItems(data.items);
      })
      .catch(() => {});
    const id = window.setInterval(() => {
      fetch("/api/notifications")
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((data: { items: Notif[] }) => {
          if (active) setItems(data.items);
        })
        .catch(() => {});
    }, 60_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [schoolId]);

  const unread = items.filter((n) => !n.readAt).length;

  const markAll = async () => {
    await fetch("/api/notifications", { method: "POST" });
    setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
  };

  const openLink = (n: Notif) => {
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <BellIcon className="size-4.5" />
          {unread > 0 ? (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 ? (
            <button
              type="button"
              onClick={markAll}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheckIcon className="size-3" />
              Mark all read
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            items.slice(0, 20).map((n) => (
              <DropdownMenuItem key={n.id} asChild className="cursor-pointer">
                <Link
                  href={n.link ?? "#"}
                  onClick={() => openLink(n)}
                  className="flex flex-col items-start gap-1 py-2"
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className={cn("text-sm font-medium", !n.readAt && "text-primary")}>
                      {n.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </span>
                  {n.body ? (
                    <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                  ) : null}
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
