"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ProfileTab = {
  value: string;
  label: string;
  count?: number;
};

export function ProfileTabs({ tabs, value }: { tabs: ProfileTab[]; value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        const params = new URLSearchParams(searchParams.toString());
        if (next === tabs[0]?.value) params.delete("tab");
        else params.set("tab", next);
        const qs = params.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      }}
    >
      <TabsList className="h-auto flex-wrap bg-muted/60 p-1">
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className="h-8 gap-1.5 px-3">
            {t.label}
            {typeof t.count === "number" ? (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium tabular-nums text-primary">
                {t.count}
              </span>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
