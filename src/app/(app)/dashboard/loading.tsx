import { Skeleton, SkeletonPageHeader, SkeletonText, SkeletonCard, SkeletonStatCard } from "@/components/ui/skeleton";
import { UsersIcon, GraduationCapIcon, UserCogIcon, WalletIcon } from "lucide-react";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader className="w-full">
        <SkeletonText className="w-24 h-6" />
        <div className="flex-1">
          <SkeletonText className="h-6 w-full rounded-md mb-2" />
          <SkeletonText className="h-4 w-2/3 rounded-md mb-1" />
        </div>
      </SkeletonPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonStatCard className="h-24" />
        <SkeletonStatCard className="h-24" />
        <SkeletonStatCard className="h-24" />
        <SkeletonStatCard className="h-24" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard className="lg:col-span-2" />
        <SkeletonCard className="h-32" />
      </div>
    </div>
  );
}