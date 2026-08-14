import { Skeleton, SkeletonPageHeader, SkeletonText, SkeletonCard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <SkeletonPageHeader className="w-full">
        <SkeletonText className="w-24 h-6" />
        <div className="flex-1">
          <SkeletonText className="h-6 w-full rounded-md mb-2" />
          <SkeletonText className="h-4 w-2/3 rounded-md mb-1" />
        </div>
      </SkeletonPageHeader>

      <SkeletonCard className="h-96" />
    </div>
  );
}