import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonText({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-text"
      className={cn("h-6 w-full rounded-md bg-muted/50", className)}
      {...props}
    />
  )
}

function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn("rounded-lg bg-muted/50 h-48", className)}
      {...props}
    />
  )
}

function SkeletonPageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-page-header"
      className={cn("flex items-start gap-4", className)}
      {...props}
    >
      <SkeletonText className="w-24 h-6" />
      <div className="flex-1">
        <SkeletonText className="h-6 w-full rounded-md mb-2" />
        <SkeletonText className="h-4 w-2/3 rounded-md mb-1" />
      </div>
    </div>
  )
}

function SkeletonStatCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-stat-card"
      className={cn("rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted/60", className)}
      {...props}
    />
  )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonPageHeader, SkeletonStatCard }
