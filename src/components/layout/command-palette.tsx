"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, MoveRightIcon } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { NAV_SECTIONS, ADMIN_NAV, type NavSection } from "@/lib/constants";
import { iconFor, type IconName } from "@/lib/icons";

type SearchResult = {
  type: "student" | "parent" | "teacher" | "class";
  id: string;
  label: string;
  sub: string;
  href: string;
};

const RESULT_ICONS: Record<SearchResult["type"], IconName> = {
  student: "users",
  parent: "user-heart",
  teacher: "graduation-cap",
  class: "school",
};

export function CommandPalette({
  open,
  onOpenChange,
  isAdminArea,
  canView,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdminArea: boolean;
  canView: (permission?: string) => boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  if (query.trim().length < 2 && (results.length > 0 || loading)) {
    setResults([]);
    setLoading(false);
  }

  const sections: NavSection[] = isAdminArea
    ? ADMIN_NAV
    : NAV_SECTIONS.map((section) => ({
        title: section.title,
        items: section.items.filter((i) => canView(i.permission)),
      })).filter((section) => section.items.length > 0);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = (await res.json()) as { results?: SearchResult[] };
        if (!cancelled) setResults(data.results ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, query]);

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      setQuery("");
      router.push(href);
    },
    [onOpenChange, router]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search">
      <CommandInput
        placeholder="Type a command or search students, teachers, classes…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{loading ? "Searching…" : "No results found."}</CommandEmpty>
        {sections.map((section) => (
          <CommandGroup key={section.title} heading={section.title}>
            {section.items.map((item) => {
              const Icon = iconFor(item.icon as IconName);
              return (
                <CommandItem
                  key={`nav:${item.href}`}
                  value={`nav:${item.href}`}
                  keywords={[item.title]}
                  onSelect={() => go(item.href)}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <span>{item.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
        {!loading && query.trim().length >= 2
          ? [
              "student",
              "parent",
              "teacher",
              "class",
            ].map((type) => {
              const group = results.filter((r) => r.type === type);
              if (!group.length) return null;
              const Icon = iconFor(RESULT_ICONS[type as SearchResult["type"]]);
              return (
                <CommandGroup key={type} heading={`${type[0].toUpperCase()}${type.slice(1)}s`}>
                  {group.map((r) => (
                    <CommandItem
                      key={r.href}
                      value={r.href}
                      keywords={[r.label, r.sub]}
                      onSelect={() => go(r.href)}
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="truncate">{r.label}</span>
                      {r.sub ? (
                        <span className="truncate text-xs text-muted-foreground">{r.sub}</span>
                      ) : null}
                      <MoveRightIcon className="ml-auto size-3.5 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })
          : null}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Searching…
          </div>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
