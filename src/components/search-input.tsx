"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchInput({
  placeholder = "Search…",
  param = "search",
  className,
  debounce = 250,
}: {
  placeholder?: string;
  param?: string;
  className?: string;
  debounce?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramValue = searchParams.get(param) ?? "";
  const [value, setValue] = useState(paramValue);

  const [prevParamValue, setPrevParamValue] = useState(paramValue);
  if (paramValue !== prevParamValue) {
    setPrevParamValue(paramValue);
    setValue(paramValue);
  }

  const update = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) params.set(param, term);
      else params.delete(param);
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams, param]
  );

  useEffect(() => {
    if (value === paramValue) return;
    const t = setTimeout(() => update(value), debounce);
    return () => clearTimeout(t);
  }, [value, paramValue, update, debounce]);

  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") update(value);
        }}
        placeholder={placeholder}
        className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent pl-8 pr-8 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:w-56"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue("");
            update("");
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
