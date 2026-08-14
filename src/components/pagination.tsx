"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export function Pagination({
  page,
  perPage,
  total,
}: {
  page: number;
  perPage: number;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  if (totalPages <= 1 && page === 1) return null;

  const go = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-3">
      <p className="text-sm text-muted-foreground">
        Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className="inline-flex size-9 items-center justify-center rounded-md border border-input disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <span className="px-2 text-sm tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => go(page + 1)}
          className="inline-flex size-9 items-center justify-center rounded-md border border-input disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
