"use client"

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import heavy chart library to reduce initial bundle size
const HeavyChart = dynamic(
    () => import('./heavy-chart-implementation').then((mod) => mod.HeavyChart),
    {
        ssr: false, // Charts often depend on window/DOM, so disable SSR
        loading: () => (
            <div className="flex flex-col gap-4 w-full">
                <Skeleton className="h-[300px] w-full rounded-xl" />
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[100px]" />
                </div>
            </div>
        ),
    }
)

export function AnalyticsChartWrapper() {
    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6">
                <h3 className="font-semibold leading-none tracking-tight mb-4">Traffic Overview</h3>
                <HeavyChart />
            </div>
        </div>
    )
}
