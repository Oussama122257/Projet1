import { PageBody } from "@/components/layout/app-shell";
import {
  CardGridSkeleton,
  ChartSkeleton,
  Skeleton,
  StatCardSkeleton,
} from "@/components/ui/skeleton";

export default function BrandLoading() {
  return (
    <PageBody>
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-3 h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <ChartSkeleton className="mt-6" />

      <div className="mt-10">
        <Skeleton className="h-5 w-40" />
        <div className="mt-4">
          <CardGridSkeleton count={3} />
        </div>
      </div>
    </PageBody>
  );
}
