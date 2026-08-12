"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";

/**
 * Client-side infinite scroll state. Loads the next page of rows when the
 * footer sentinel scrolls into view. State resets whenever `initialRows`
 * changes (e.g. the server re-renders with new search filters).
 */
export function useInfiniteList<T extends { id: string }>({
  initialRows,
  total,
  perPage,
  loadMore,
  initialPage = 1,
}: {
  initialRows: T[];
  total: number;
  perPage: number;
  loadMore: (page: number) => Promise<T[]>;
  initialPage?: number;
}) {
  const [rows, setRows] = useState(initialRows);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const busyRef = useRef(false);

  const hasMore = rows.length < total;

  useEffect(() => {
    setRows(initialRows);
    setPage(initialPage);
    setLoading(false);
    setError(false);
    busyRef.current = false;
  }, [initialRows, initialPage]);

  const loadNext = useCallback(async () => {
    if (busyRef.current || !hasMore) return;
    busyRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const next = await loadMore(page + 1);
      if (next.length > 0) {
        setRows((prev) => {
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...next.filter((r) => !seen.has(r.id))];
        });
        setPage((p) => p + 1);
      }
    } catch {
      setError(true);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [page, hasMore, loadMore]);

  return { rows, loading, error, hasMore, loadNext };
}

/**
 * Sentinel + loading / error / end-of-list footer. Rendered below the list.
 */
export function InfiniteListFooter({
  loading,
  error,
  hasMore,
  loadNext,
  total,
  loaded,
  perPage,
}: {
  loading: boolean;
  error: boolean;
  hasMore: boolean;
  loadNext: () => Promise<void>;
  total: number;
  loaded: number;
  perPage: number;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadNext();
      },
      { rootMargin: "300px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, error, loadNext]);

  return (
    <div
      ref={sentinelRef}
      className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
    >
      {error ? (
        <>
          <span>Failed to load more</span>
          <button
            type="button"
            onClick={loadNext}
            className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-0.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            <RefreshCwIcon className="size-3" />
            Retry
          </button>
        </>
      ) : loading ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          <span>Loading more…</span>
        </>
      ) : !hasMore && loaded > perPage ? (
        <span>You&apos;ve reached the end</span>
      ) : null}
    </div>
  );
}
