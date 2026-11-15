import type { Metadata } from "next"
import { dehydrate, HydrationBoundary, type QueryClient } from "@tanstack/react-query"

import { DashboardView } from "@/features/dashboard/components/dashboard-view"
import { dashboardKeys } from "@/features/dashboard/hooks/use-dashboard"
import type {
  DashboardStats,
  RecentActivityItem,
} from "@/features/dashboard/services/dashboard.service"
import {
  DASHBOARD_ACTIVITY_LIMIT,
  DASHBOARD_PROJECTS_QUERY,
  DASHBOARD_TRENDS_WINDOW,
} from "@/features/dashboard/lib/queries"
import type { DashboardPreferences } from "@/features/dashboard/lib/widget-layout"
import { projectKeys } from "@/features/projects/lib/query-keys"
import { trendKeys } from "@/features/trends/hooks/use-trends"
import type { ForMeTrendFeed } from "@/features/trends/types"
import type { PaginatedResponse, Project } from "@/types"
import { serverGet, serverGetEnvelope } from "@/lib/server-api"
import { makeQueryClient } from "@/lib/query-client"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your content creation workspace — projects, scripts, and performance metrics.",
}

/**
 * A failed prefetch must not 500 the page (T14 §4). `prefetchQuery` already
 * stores the error rather than throwing, but each call is isolated anyway so a
 * hung dependency cannot block the others: the widgets render independently and
 * each has its own retry.
 */
async function prefetch(
  queryClient: QueryClient,
  options: Parameters<QueryClient["prefetchQuery"]>[0]
): Promise<void> {
  try {
    await queryClient.prefetchQuery(options)
  } catch {
    // The matching hook owns the error state and retry affordance.
  }
}

export default async function DashboardPage() {
  const queryClient = makeQueryClient()

  // Parallel, never serial: dashboard stats being slow must not delay projects.
  await Promise.all([
    prefetch(queryClient, {
      queryKey: dashboardKeys.stats(),
      queryFn: () => serverGet<DashboardStats>("/dashboard/stats"),
    }),
    prefetch(queryClient, {
      queryKey: dashboardKeys.preferences(),
      queryFn: () => serverGet<DashboardPreferences>("/users/profile/preferences"),
    }),
    prefetch(queryClient, {
      queryKey: dashboardKeys.recentActivity(DASHBOARD_ACTIVITY_LIMIT),
      queryFn: () =>
        serverGet<RecentActivityItem[]>("/dashboard/recent-activity", {
          limit: DASHBOARD_ACTIVITY_LIMIT,
        }),
    }),
    prefetch(queryClient, {
      queryKey: projectKeys.list(DASHBOARD_PROJECTS_QUERY),
      queryFn: () =>
        serverGetEnvelope<PaginatedResponse<Project>>("/projects", DASHBOARD_PROJECTS_QUERY),
    }),
    prefetch(queryClient, {
      queryKey: trendKeys.forMe(DASHBOARD_TRENDS_WINDOW, false),
      queryFn: () =>
        serverGet<ForMeTrendFeed>("/trends/for-me", {
          window: DASHBOARD_TRENDS_WINDOW,
        }),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView />
    </HydrationBoundary>
  )
}
