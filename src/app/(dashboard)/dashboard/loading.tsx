import { Skeleton } from "@/components/ui/skeleton"

/**
 * Route-level skeleton that mirrors the final 12-column grid (T14 §5), so the
 * page does not reflow when hydrated data arrives. No centred spinner.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-52 rounded-xl lg:col-span-6" />
        <Skeleton className="h-52 rounded-xl lg:col-span-6" />
        <Skeleton className="h-52 rounded-xl lg:col-span-6" />
        <Skeleton className="h-52 rounded-xl lg:col-span-6" />
      </div>
    </div>
  )
}
