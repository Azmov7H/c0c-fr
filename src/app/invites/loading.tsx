import { Skeleton } from "@/components/ui/skeleton"

/**
 * T20: route-level loading state for `/invites/[token]`. It sits outside every
 * route-group that has its own `loading.tsx` (the invite flow has its own layout
 * — `noindex`, centered card — so a group-level file would render under the wrong
 * shell). The card keeps its final footprint so the decision page does not shift
 * once the JS lands.
 */
export default function InviteLoading() {
  return (
    <div className="w-full max-w-md space-y-6">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="space-y-4 rounded-2xl border border-border/60 p-6">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  )
}
