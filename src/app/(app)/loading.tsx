"use client";

import { SkeletonPageHeader, SkeletonStatCard, SkeletonCard, SkeletonTable } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <SkeletonPageHeader />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard className="lg:col-span-2" />
        <SkeletonCard />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}