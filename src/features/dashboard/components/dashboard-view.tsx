"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Calendar,
  FileText,
  Flame,
  LayoutDashboard,
  Lightbulb,
  Lock,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DataState } from "@/components/shared/data-state"
import { PageHeader } from "@/components/shared/page-header"
import { useAuthStore } from "@/store/auth-store"
import type { Platform, Project, ProjectStatus } from "@/types"

import {
  useDashboardPreferences,
  useDashboardStats,
  useHealthReady,
  useRecentActivity,
  useUpdateDashboardPreferences,
} from "../hooks/use-dashboard"
import { useProjects } from "@/features/projects/hooks/use-projects"
import { useForMeTrendFeed } from "@/features/trends/hooks/use-trends"
import type { RecentActivityItem } from "../services/dashboard.service"
import {
  DASHBOARD_ACTIVITY_LIMIT,
  DASHBOARD_PROJECTS_QUERY,
  DASHBOARD_TRENDS_WINDOW,
} from "../lib/queries"
import {
  EMPTY_PREFERENCES,
  DASHBOARD_WIDGET_IDS,
  WIDGET_LABELS,
  orderPlatforms,
  visibleWidgets,
  widgetLock,
  type DashboardPreferences,
  type DashboardWidgetId,
} from "../lib/widget-layout"
import {
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from "../lib/format"

/**
 * Recharts is deliberately outside the first-load chunk. The dashboard's job is
 * the projects list; a chart that costs ~100 kB gzip before it can render is not
 * allowed on the critical path (T14 §4, budget 220 kB gzip).
 */
const CreationTrendChart = dynamic(() => import("./creation-trend-chart"), {
  ssr: false,
  loading: () => <Skeleton className="h-48 w-full rounded-xl" />,
})

const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "Draft",
  processing: "In progress",
  completed: "Completed",
  archived: "Archived",
}

const STATUS_TONE: Record<ProjectStatus, string> = {
  draft: "border-border/60 bg-muted/40 text-muted-foreground",
  processing: "border-warning/30 bg-warning/10 text-warning",
  completed: "border-success/30 bg-success/10 text-success",
  archived: "border-border/60 bg-muted/30 text-muted-foreground",
}

const PLATFORM_TONE: Record<Platform, string> = {
  youtube: "bg-negative/10 text-negative",
  tiktok: "bg-info/10 text-info",
  instagram: "bg-brand-violet/10 text-brand-violet",
}

type StatusFilter = "all" | ProjectStatus

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "processing", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
]

const WIDGET_SPAN: Record<DashboardWidgetId, string> = {
  stats: "lg:col-span-12",
  projects: "lg:col-span-12",
  status: "lg:col-span-6",
  platforms: "lg:col-span-6",
  trending: "lg:col-span-6",
  activity: "lg:col-span-6",
  upcoming: "lg:col-span-6",
  quickActions: "lg:col-span-6",
  analytics: "lg:col-span-6",
  health: "lg:col-span-12",
}

// ─── Small building blocks ──────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string
  value?: number
  sub: string
  icon: React.ElementType
  color: string
  isLoading?: boolean
}) {
  return (
    <Card className="border-border/50 bg-card transition-all duration-200 hover:border-primary/20 hover:shadow-premium">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-2 pt-5">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </CardTitle>
        <div className="rounded-lg bg-muted/60 p-2">
          <Icon className={`h-3.5 w-3.5 ${color}`} aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {/* Never render 0 for "not loaded" — 0 and loading are different facts. */}
        {isLoading ? (
          <Skeleton className="mt-1 h-9 w-16" />
        ) : (
          <span className="text-3xl font-black tracking-tight tabular-nums">
            {formatNumber(value ?? 0)}
          </span>
        )}
        <p className="mt-2 text-xs font-medium text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}

function WidgetCard({
  id,
  title,
  description,
  action,
  children,
}: {
  id: DashboardWidgetId
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const headingId = `widget-${id}-heading`
  return (
    <Card className="border-border/50 bg-card" data-widget={id} aria-labelledby={headingId}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
        <div>
          <CardTitle id={headingId} role="heading" aria-level={2} className="text-base font-bold">
            {title}
          </CardTitle>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  )
}

function ProjectThumb({ project }: { project: Project }) {
  const sameOrigin = project.thumbnailUrl?.startsWith("/")
  return (
    <div
      className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ${PLATFORM_TONE[project.platform]}`}
      aria-hidden="true"
    >
      {sameOrigin ? (
        // eslint-disable-next-line @next/next/no-img-element -- CSP allows same-origin only; these are user uploads proxied by the BFF.
        <img
          src={project.thumbnailUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-sm font-black uppercase">
          {project.title.trim().charAt(0) || "P"}
        </span>
      )}
    </div>
  )
}

function ProjectRow({ project }: { project: Project }) {
  const updated = formatRelativeTime(project.updatedAt)
  return (
    <Link
      href={`/projects/${project._id}`}
      className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-colors hover:border-border/60 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ProjectThumb project={project} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{project.title}</p>
        <p className="text-xs text-muted-foreground">
          {PLATFORM_LABEL[project.platform]} ·{" "}
          <time dateTime={project.updatedAt} title={updated.absolute}>
            {updated.relative}
          </time>
        </p>
      </div>
      <Badge variant="outline" className={`text-[10px] font-semibold ${STATUS_TONE[project.status]}`}>
        {STATUS_LABEL[project.status]}
      </Badge>
    </Link>
  )
}

// ─── Widgets ────────────────────────────────────────────────────────────────

function MetricsWidget({ loading }: { loading: boolean }) {
  const { data, isLoading, isError, refetch } = useDashboardStats()
  return (
    <DataState
      isLoading={loading || isLoading}
      error={isError ? new Error("Your key metrics could not be loaded.") : null}
      onRetry={() => void refetch()}
      loadingFallback={
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Projects"
          value={data?.overview.totalProjects}
          sub={`${formatNumber(data?.overview.activeProjects ?? 0)} in progress`}
          icon={FileText}
          color="text-info"
        />
        <MetricCard
          label="Scripts"
          value={data?.overview.totalScripts}
          sub="Generated"
          icon={Zap}
          color="text-primary"
        />
        <MetricCard
          label="Thumbnails"
          value={data?.overview.totalThumbnails}
          sub="Designed"
          icon={Sparkles}
          color="text-brand-violet"
        />
        <MetricCard
          label="Media"
          value={data?.overview.totalMediaItems}
          sub="In your library"
          icon={BarChart3}
          color="text-success"
        />
      </div>
    </DataState>
  )
}

function ProjectsWidget({
  status,
  onStatusChange,
}: {
  status: StatusFilter
  onStatusChange: (value: StatusFilter) => void
}) {
  const { data: stats } = useDashboardStats()
  const { data, isLoading, isError, refetch } = useProjects(DASHBOARD_PROJECTS_QUERY)

  const allProjects = data?.data ?? []
  const filtered = status === "all" ? allProjects : allProjects.filter((p) => p.status === status)

  const counts: Record<StatusFilter, number> = {
    all: stats?.overview.totalProjects ?? allProjects.length,
    draft: stats?.overview.draftProjects ?? 0,
    processing: stats?.overview.activeProjects ?? 0,
    completed: stats?.overview.completedProjects ?? 0,
    archived: stats?.overview.archivedProjects ?? 0,
  }

  const continueProject = allProjects.find((p) => p.status === "draft")

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter projects by status">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={status === filter.value ? "secondary" : "ghost"}
              aria-pressed={status === filter.value}
              onClick={() => onStatusChange(filter.value)}
              className="h-8 rounded-full px-3 text-xs"
            >
              {filter.label}
              <span className="ml-1.5 tabular-nums text-muted-foreground">
                {isLoading ? "–" : formatNumber(counts[filter.value])}
              </span>
            </Button>
          ))}
        </div>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-primary hover:bg-primary/10">
            View all <ArrowRight className="ml-1 size-3" aria-hidden="true" />
          </Button>
        </Link>
      </div>

      {continueProject ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <ProjectThumb project={continueProject} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Continue where you left off
              </p>
              <p className="truncate text-sm font-semibold">{continueProject.title}</p>
            </div>
          </div>
          <Link href={`/projects/${continueProject._id}`}>
            <Button size="sm" className="h-8 rounded-lg px-3 text-xs">
              Resume <ArrowRight className="ml-1 size-3" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      ) : null}

      <DataState
        isLoading={isLoading}
        error={isError ? new Error("Your projects could not be loaded.") : null}
        isEmpty={filtered.length === 0}
        emptyTitle={
          status === "all"
            ? "Create your first project"
            : `No ${STATUS_LABEL[status as ProjectStatus].toLowerCase()} projects`
        }
        emptyDescription={
          status === "all"
            ? "Projects hold your scripts, thumbnails, audio and SEO in one place."
            : "Nothing matches this status yet. Try another filter or create a project."
        }
        emptyIcon={FileText}
        emptyAction={{
          label: "Create your first project",
          onClick: () => {
            window.location.href = "/projects/new"
          },
        }}
        onRetry={() => void refetch()}
        skeletonRows={3}
        loadingFallback={
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <ul aria-label="Projects" className="divide-y divide-border/40">
          {filtered.slice(0, 8).map((project) => (
            <li key={project._id}>
              <ProjectRow project={project} />
            </li>
          ))}
        </ul>
      </DataState>
    </div>
  )
}

function StatusWidget() {
  const { data, isLoading, isError, refetch } = useDashboardStats()
  const rows: Array<{ key: ProjectStatus; label: string; count: number }> = [
    { key: "draft", label: "Draft", count: data?.overview.draftProjects ?? 0 },
    { key: "processing", label: "In progress", count: data?.overview.activeProjects ?? 0 },
    { key: "completed", label: "Completed", count: data?.overview.completedProjects ?? 0 },
    { key: "archived", label: "Archived", count: data?.overview.archivedProjects ?? 0 },
  ]
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  return (
    <DataState
      isLoading={isLoading}
      error={isError ? new Error("Project status could not be loaded.") : null}
      onRetry={() => void refetch()}
      loadingFallback={<Skeleton className="h-36 w-full rounded-xl" />}
    >
      <ul className="space-y-3">
        {rows.map((row) => {
          const share = total > 0 ? Math.round((row.count / total) * 100) : 0
          return (
            <li key={row.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{row.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatNumber(row.count)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${share}%` }}
                  role="presentation"
                />
              </div>
            </li>
          )
        })}
      </ul>
    </DataState>
  )
}

function PlatformsWidget() {
  const { data, isLoading, isError, refetch } = useDashboardStats()
  const preferences = useDashboardPreferences().data ?? EMPTY_PREFERENCES
  const platforms = orderPlatforms(preferences.preferredPlatforms)
  const counts = data?.projectsByPlatform ?? { youtube: 0, tiktok: 0, instagram: 0 }
  const total = platforms.reduce((sum, platform) => sum + counts[platform], 0)

  return (
    <DataState
      isLoading={isLoading}
      error={isError ? new Error("Platform split could not be loaded.") : null}
      isEmpty={!isLoading && total === 0}
      emptyTitle="No projects by platform yet"
      emptyDescription="Create a project and it will appear in this breakdown."
      emptyIcon={LayoutDashboard}
      onRetry={() => void refetch()}
      loadingFallback={<Skeleton className="h-36 w-full rounded-xl" />}
    >
      <ul className="space-y-3">
        {platforms.map((platform) => {
          const count = counts[platform]
          const share = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <li key={platform} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{PLATFORM_LABEL[platform]}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatNumber(count)} · {formatPercent(share)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${PLATFORM_TONE[platform].split(" ")[0]}`}
                  style={{ width: `${share}%` }}
                  role="presentation"
                />
              </div>
            </li>
          )
        })}
      </ul>
    </DataState>
  )
}

function TrendingWidget() {
  const { data, isLoading, isError, refetch } = useForMeTrendFeed(DASHBOARD_TRENDS_WINDOW, false)
  const topics = data?.topics?.slice(0, 4) ?? []

  return (
    <DataState
      isLoading={isLoading}
      error={isError ? new Error("Your trend feed could not be loaded.") : null}
      isEmpty={topics.length === 0}
      emptyTitle="No trends measured for you yet"
      emptyDescription="Pick interests in onboarding and we can rank topics against them."
      emptyIcon={Flame}
      emptyAction={{
        label: "Update your interests",
        onClick: () => {
          window.location.href = "/onboarding?edit=1"
        },
      }}
      onRetry={() => void refetch()}
      loadingFallback={
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      }
    >
      <ul className="divide-y divide-border/40">
        {topics.map((topic) => (
          <li key={topic.topic} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{topic.topic}</p>
              <p className="truncate text-xs text-muted-foreground">
                {topic.matchedPlatforms.length > 0
                  ? topic.matchedPlatforms.join(" · ")
                  : topic.platforms.join(" · ")}
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-warning/30 bg-warning/10 text-[10px] font-semibold text-warning"
            >
              {formatNumber(topic.viralScore)} score
            </Badge>
          </li>
        ))}
      </ul>
      <div className="mt-2 text-right">
        <Link href="/trends" className="text-xs font-medium text-primary hover:underline">
          Explore trends <ArrowRight className="ml-0.5 inline size-3" aria-hidden="true" />
        </Link>
      </div>
    </DataState>
  )
}

function ActivityWidget() {
  const { data, isLoading, isError, refetch } = useRecentActivity(DASHBOARD_ACTIVITY_LIMIT)

  return (
    <DataState
      isLoading={isLoading}
      error={isError ? new Error("Recent activity could not be loaded.") : null}
      isEmpty={(data?.length ?? 0) === 0}
      emptyTitle="No activity yet"
      emptyDescription="Generate a script or create a project to start the feed."
      emptyIcon={Zap}
      onRetry={() => void refetch()}
      loadingFallback={
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      }
    >
      <ul className="divide-y divide-border/40">
        {(data ?? []).map((item: RecentActivityItem) => {
          const when = formatRelativeTime(item.createdAt)
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {item.type === "project" ? (
                    <FileText className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Zap className="size-3.5" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.type} ·{" "}
                    <time dateTime={item.createdAt} title={when.absolute}>
                      {when.relative}
                    </time>
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-[10px] font-semibold capitalize text-primary"
              >
                {item.status || "new"}
              </Badge>
            </li>
          )
        })}
      </ul>
    </DataState>
  )
}

function UpcomingWidget() {
  const { data, isLoading, isError, refetch } = useDashboardStats()
  const events = data?.upcomingEvents ?? []

  return (
    <DataState
      isLoading={isLoading}
      error={isError ? new Error("Upcoming content could not be loaded.") : null}
      isEmpty={events.length === 0}
      emptyTitle="Nothing scheduled"
      emptyDescription="Plan a publish date and it will show up here."
      emptyIcon={Calendar}
      onRetry={() => void refetch()}
      loadingFallback={<Skeleton className="h-24 w-full rounded-xl" />}
    >
      <ul className="space-y-2">
        {events.slice(0, 4).map((event) => {
          const when = new Date(event.scheduledDate)
          return (
            <li key={event._id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/40">
              <div className="w-10 shrink-0 text-center">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">
                  {when.toLocaleString("en-US", { month: "short" })}
                </p>
                <p className="text-base font-black leading-none">{when.getDate()}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{event.title}</p>
                <p className="text-[10px] capitalize text-muted-foreground">{event.status}</p>
              </div>
              {event.platform ? (
                <Badge variant="outline" className="h-4 px-1.5 text-[9px] capitalize">
                  {event.platform}
                </Badge>
              ) : null}
            </li>
          )
        })}
      </ul>
    </DataState>
  )
}

function QuickActionsWidget() {
  const actions = [
    { title: "Generate Script", sub: "AI content engine", icon: Zap, href: "/scripts", tone: "bg-primary/10 text-primary" },
    { title: "Explore Trends", sub: "What is rising", icon: Lightbulb, href: "/trends", tone: "bg-warning/10 text-warning" },
    { title: "New Project", sub: "Start from an idea", icon: Plus, href: "/projects/new", tone: "bg-success/10 text-success" },
    { title: "Team", sub: "Invite collaborators", icon: Users, href: "/team", tone: "bg-brand-violet/10 text-brand-violet" },
  ]

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {actions.map((action) => (
        <li key={action.title}>
          <Link
            href={action.href}
            className="flex items-center gap-3 rounded-xl border border-border/40 p-3 transition-all hover:border-primary/30 hover:bg-muted/40"
          >
            <div className={`${action.tone} shrink-0 rounded-lg p-2`}>
              <action.icon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{action.title}</p>
              <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                {action.sub}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function AnalyticsWidget({ lockedReason, upgradeHref }: { lockedReason?: string; upgradeHref?: string }) {
  const { data, isLoading, isError, refetch } = useDashboardStats()

  // A locked widget explains itself even when there is no data to show —
  // otherwise "no activity yet" would hide the actual reason it is unavailable.
  if (lockedReason) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 p-6 text-center">
        <div className="rounded-full bg-muted p-3">
          <Lock className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">{lockedReason}</p>
        <Link href={upgradeHref ?? "/settings/billing"}>
          <Button size="sm" variant="outline">
            See plans
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <DataState
      isLoading={isLoading}
      error={isError ? new Error("The creation trend could not be loaded.") : null}
      isEmpty={(data?.trendVelocity.length ?? 0) === 0}
      emptyTitle="No creation activity yet"
      emptyDescription="Create projects this week and the trend appears here."
      emptyIcon={BarChart3}
      onRetry={() => void refetch()}
      loadingFallback={<Skeleton className="h-48 w-full rounded-xl" />}
    >
      <CreationTrendChart data={data?.trendVelocity ?? []} />
    </DataState>
  )
}

function HealthWidget() {
  const { data, isPending, isError, refetch } = useHealthReady()

  if (isPending) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-4">
        <Skeleton className="size-2 rounded-full" />
        <Skeleton className="h-3 w-40" />
      </div>
    )
  }

  const degraded = isError || data?.status !== "ready"
  const label = isError
    ? "Status unavailable — the API could not be reached"
    : data.status === "ready"
      ? "API ready — database connected"
      : `Degraded — database ${data.checks.database}`

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-4 ${
        degraded ? "border-warning/20 bg-warning/5" : "border-success/20 bg-success/5"
      }`}
      data-state={degraded ? "degraded" : "ready"}
    >
      <div className={`size-2 rounded-full ${degraded ? "bg-warning" : "bg-success"}`} />
      <p className={`text-xs font-semibold ${degraded ? "text-warning" : "text-success"}`}>
        {label}
      </p>
      {isError ? (
        <Button variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs" onClick={() => void refetch()}>
          <RotateCcw className="mr-1 size-3" aria-hidden="true" /> Retry
        </Button>
      ) : null}
    </div>
  )
}

// ─── Widget settings ────────────────────────────────────────────────────────

function WidgetSettings({
  preferences,
  pending,
  onToggle,
  onShowAll,
}: {
  preferences: DashboardPreferences
  pending: boolean
  onToggle: (id: DashboardWidgetId, hidden: boolean) => void
  onShowAll: () => void
}) {
  const hidden = new Set(preferences.hiddenWidgets)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-xl px-4">
          <Settings2 className="mr-1.5 size-3.5" aria-hidden="true" />
          Customise
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dashboard widgets</DialogTitle>
          <DialogDescription>
            Hidden widgets stay out of the way but remain available here. Your layout is saved
            to your account.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-1">
          {DASHBOARD_WIDGET_IDS.map((id) => (
            <li key={id}>
              <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted/50">
                <span>{WIDGET_LABELS[id]}</span>
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={!hidden.has(id)}
                  disabled={pending}
                  onChange={(event) => onToggle(id, !event.target.checked)}
                  aria-label={`Show ${WIDGET_LABELS[id]}`}
                />
              </label>
            </li>
          ))}
        </ul>

        <Button variant="ghost" size="sm" onClick={onShowAll} disabled={pending}>
          Show all widgets
        </Button>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main view ──────────────────────────────────────────────────────────────

export function DashboardView() {
  const [status, setStatus] = React.useState<StatusFilter>("all")

  const statsQuery = useDashboardStats()
  const preferencesQuery = useDashboardPreferences()
  const updatePreferences = useUpdateDashboardPreferences()
  const plan = useAuthStore((state) => state.user?.plan)

  const preferences = preferencesQuery.data ?? EMPTY_PREFERENCES
  const widgets = visibleWidgets(preferences)
  const { locked, reason, upgradeHref } = widgetLock("analytics", plan)

  const toggleWidget = (id: DashboardWidgetId, shouldHide: boolean) => {
    const next = shouldHide
      ? [...new Set([...preferences.hiddenWidgets, id])]
      : preferences.hiddenWidgets.filter((widget) => widget !== id)
    updatePreferences.mutate(next)
  }

  const renderWidget = (id: DashboardWidgetId) => {
    switch (id) {
      case "stats":
        return <MetricsWidget loading={statsQuery.isLoading} />
      case "projects":
        return <ProjectsWidget status={status} onStatusChange={setStatus} />
      case "status":
        return <StatusWidget />
      case "platforms":
        return <PlatformsWidget />
      case "trending":
        return <TrendingWidget />
      case "activity":
        return <ActivityWidget />
      case "upcoming":
        return <UpcomingWidget />
      case "quickActions":
        return <QuickActionsWidget />
      case "analytics":
        return <AnalyticsWidget lockedReason={locked ? reason : undefined} upgradeHref={upgradeHref} />
      case "health":
        return <HealthWidget />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Dashboard"
        description="Your projects, trends and activity at a glance."
        actions={
          <>
            <WidgetSettings
              preferences={preferences}
              pending={updatePreferences.isPending}
              onToggle={toggleWidget}
              onShowAll={() => updatePreferences.mutate([])}
            />
            <Link href="/projects/new">
              <Button size="sm" className="h-9 rounded-xl px-4">
                <Plus className="mr-1.5 size-3.5" aria-hidden="true" />
                New Project
              </Button>
            </Link>
          </>
        }
      />

      {preferencesQuery.isError ? (
        <p className="text-xs text-muted-foreground">
          Your saved layout could not be loaded; showing the default layout.
        </p>
      ) : null}

      {widgets.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border p-12 text-center">
          <LayoutDashboard className="size-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold">All widgets are hidden</h2>
            <p className="text-sm text-muted-foreground">
              Bring them back from Customise — nothing is lost.
            </p>
          </div>
          <Button onClick={() => updatePreferences.mutate([])}>Show all widgets</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {widgets.map((id) => (
            <section key={id} className={WIDGET_SPAN[id]}>
              {id === "stats" || id === "projects" ? (
                <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {id === "stats" ? "Key metrics" : "Projects"}
                  </h2>
                  {renderWidget(id)}
                </div>
              ) : (
                <WidgetCard
                  id={id}
                  title={WIDGET_LABELS[id]}
                  description={
                    id === "analytics"
                      ? "Projects created over the last seven days"
                      : id === "health"
                        ? "Live dependency status"
                        : undefined
                  }
                >
                  {renderWidget(id)}
                </WidgetCard>
              )}
            </section>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Want a different overview?{" "}
        <Link href="/onboarding?edit=1" className="font-medium text-primary hover:underline">
          Update your interests
        </Link>{" "}
        to personalise trending and defaults.
      </p>
    </div>
  )
}
