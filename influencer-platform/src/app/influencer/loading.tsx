import { PageBody } from "@/components/layout/app-shell";
import {
  CardGridSkeleton,
  ChartSkeleton,
  Skeleton,
  StatCardSkeleton,
} from "@/components/ui/skeleton";

export default function InfluencerLoading() {
  return (
    <PageBody>
      <div className="border-b border-border pb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-8 w-56" />
        <Skeleton className="mt-3 h-4 w-80" />
      </div>

      {/* earnings hero */}
      <div className="mt-8 rounded-lg border border-border bg-surface-raised p-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-11 w-64" />
        <div className="mt-6 flex gap-10">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <ChartSkeleton className="mt-6" />

      <div className="mt-10">
        <Skeleton className="h-5 w-40" />
        <div className="mt-4">
          <CardGridSkeleton count={2} />
        </div>
      </div>
    </PageBody>
  );
}
