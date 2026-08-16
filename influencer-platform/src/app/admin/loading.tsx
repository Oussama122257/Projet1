import { PageBody } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <PageBody>
      <div className="border-b border-border pb-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-[28rem]" />
      </div>

      <div className="mt-6 flex gap-1.5">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-surface-raised p-5"
            style={{ opacity: 1 - i * 0.2 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <Skeleton className="size-9 rounded-md" />
                <div>
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="mt-2 h-3 w-80" />
                </div>
              </div>
              <Skeleton className="size-9 rounded-full" />
            </div>
            <div className="mt-5 grid gap-5 border-t border-border pt-5 lg:grid-cols-2">
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-8" />
                ))}
              </div>
              <Skeleton className="h-24" />
            </div>
          </div>
        ))}
      </div>
    </PageBody>
  );
}
