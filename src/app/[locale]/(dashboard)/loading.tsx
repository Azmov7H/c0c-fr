import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="space-y-6 w-full animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-10 w-[120px] rounded-lg" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[140px] w-full rounded-2xl" />
                ))}
            </div>

            <div className="flex flex-col gap-4 mt-8">
                <Skeleton className="h-9 w-[180px]" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-[80px] w-full rounded-xl" />
                ))}
            </div>
        </div>
    )
}
