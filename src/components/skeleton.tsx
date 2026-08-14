"use client";

import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border bg-card p-6", className)} {...props}>
      <Skeleton className="h-6 w-1/4 mb-4" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-1/3 mt-2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className, ...props }: { rows?: number; cols?: number; className?: string } & React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className={cn("rounded-lg border", className)} {...props}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <Skeleton className="h-4 w-3/4" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, row) => (
              <tr key={row} className="border-t">
                {Array.from({ length: cols }).map((_, col) => (
                  <td key={col} className="p-4 align-middle">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonList({ items = 5, className, ...props }: { items?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border bg-card p-6", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-3 w-1/3 mt-1" />
        </div>
        <Skeleton className="size-9 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonPageHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-5 w-1/2" />
    </div>
  );
}

export function ListPageSkeleton({ rows = 6, cols = 5, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <SkeletonPageHeader />
      <div className="rounded-xl border bg-card p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full sm:w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <SkeletonTable rows={rows} cols={cols} />
    </div>
  );
}

export function CardGridSkeleton({ cards = 6, className }: { cards?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <SkeletonPageHeader />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}