import { Skeleton } from "@/components/ui/skeleton"

/**
 * T20: route-level loading state for the marketing group. Streaming a skeleton
 * keeps navigation responsive while the server component resolves, instead of
 * holding the previous page until the new one is ready.
 */
export default function MarketingLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-16">
      <div className="space-y-4">
        <Skeleton className="h-12 w-[min(560px,90%)]" />
        <Skeleton className="h-5 w-[min(420px,80%)]" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}
