"use client"

import { useUrlLocale } from '@/i18n/locale';
import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Plus,
  Settings2,
  Sparkles,
  Zap,
} from "lucide-react"

import { DirIcon } from "@/components/icons/dir-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardDataState } from "./dashboard-data-state"
import { PageHeader } from "@/components/shared/page-header"
import type { Platform, Project, ProjectStatus } from "@/types"

import {
  useDashboardPreferences,
  useDashboardStats,
  useUpdateDashboardPreferences,
} from "../hooks/use-dashboard"
import { useProjects } from "@/features/projects/hooks/use-projects"
import { useBillingSummary } from "@/features/billing/hooks/use-billing"
import { hasFeature } from "@/features/billing/lib/entitlements"
import { UpgradePrompt } from "@/features/billing/components/upgrade-prompt"
import { DASHBOARD_PROJECTS_QUERY } from "../lib/queries"
import {
  EMPTY_PREFERENCES,
  PROJECT_STATUS_KEYS,
  WIDGET_DESCRIPTION_KEYS,
  WIDGET_LABEL_KEYS,
  visibleWidgets,
  widgetLock,
  type DashboardWidgetId,
} from "../lib/widget-layout"
import { formatNumber, formatRelativeTime } from "../lib/format"

/**
 * Recharts is deliberately outside the first-load chunk. The dashboard's job is
 * the projects list; a chart that costs ~100 kB gzip before it can render is not
 * allowed on the critical path (T14 §4, budget 220 kB gzip).
 */
const CreationTrendChart = dynamic(() => import("./creation-trend-chart"), {
  ssr: false,
  loading: () => <Skeleton className="h-48 w-full rounded-xl" />,
})

const DashboardWidget = dynamic(
  () => import("./dashboard-widgets").then((mod) => mod.DashboardWidget),
  {
    ssr: false,
    loading: () => <Skeleton className="h-32 w-full rounded-xl" />,
  }
)

const WidgetSettings = dynamic(
  () => import("./widget-settings").then((mod) => mod.WidgetSettings),
  {
    ssr: false,
    loading: () => <WidgetSettingsFallback />,
  }
)

function WidgetSettingsFallback() {
  const t = useTranslations("dashboard")
  return (
    <Button variant="outline" size="sm" className="h-9 rounded-xl px-4" disabled>
      <Settings2 className="me-1.5 size-3.5" aria-hidden="true" />
      {t("settings.trigger")}
    </Button>
  )
}

const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
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
  facebook: "bg-info/10 text-info",
}

type StatusFilter = "all" | ProjectStatus
type StatusFilterKey =
  | (typeof PROJECT_STATUS_KEYS)[keyof typeof PROJECT_STATUS_KEYS]
  | "statuses.all"

const STATUS_FILTERS: Array<{ value: StatusFilter; labelKey: StatusFilterKey }> = [
  { value: "all", labelKey: "statuses.all" },
  { value: "draft", labelKey: PROJECT_STATUS_KEYS.draft },
  { value: "processing", labelKey: PROJECT_STATUS_KEYS.processing },
  { value: "completed", labelKey: PROJECT_STATUS_KEYS.completed },
  { value: "archived", labelKey: PROJECT_STATUS_KEYS.archived },
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
    const locale = useUrlLocale();
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
            {formatNumber(value ?? 0, locale)}
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
  const t = useTranslations("dashboard")
    const locale = useUrlLocale();
  const updated = formatRelativeTime(project.updatedAt, locale)
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
        {t(PROJECT_STATUS_KEYS[project.status])}
      </Badge>
    </Link>
  )
}

// ─── Widgets ────────────────────────────────────────────────────────────────

function MetricsWidget({ loading }: { loading: boolean }) {
  const t = useTranslations("dashboard")
    const locale = useUrlLocale();
  const { data, isLoading, isError, refetch } = useDashboardStats()
  return (
    <DashboardDataState
      isLoading={loading || isLoading}
      error={isError ? new Error(t("metrics.error")) : null}
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
          label={t("metrics.projects")}
          value={data?.overview.totalProjects}
          sub={t("metrics.inProgress", {
            count: formatNumber(data?.overview.activeProjects ?? 0, locale),
          })}
          icon={FileText}
          color="text-info"
        />
        <MetricCard
          label={t("metrics.scripts")}
          value={data?.overview.totalScripts}
          sub={t("metrics.generated")}
          icon={Zap}
          color="text-primary"
        />
        <MetricCard
          label={t("metrics.thumbnails")}
          value={data?.overview.totalThumbnails}
          sub={t("metrics.designed")}
          icon={Sparkles}
          color="text-brand-violet"
        />
        <MetricCard
          label={t("metrics.media")}
          value={data?.overview.totalMediaItems}
          sub={t("metrics.inLibrary")}
          icon={BarChart3}
          color="text-success"
        />
      </div>
    </DashboardDataState>
  )
}

function ProjectsWidget({
  status,
  onStatusChange,
}: {
  status: StatusFilter
  onStatusChange: (value: StatusFilter) => void
}) {
  const t = useTranslations("dashboard")
    const locale = useUrlLocale();
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
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label={t("projects.filterAria")}
        >
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
              {t(filter.labelKey)}
              <span className="ms-1.5 tabular-nums text-muted-foreground">
                {isLoading ? "–" : formatNumber(counts[filter.value], locale)}
              </span>
            </Button>
          ))}
        </div>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-primary hover:bg-primary/10">
            {t("projects.viewAll")}{' '}
            <DirIcon name="ArrowRight" className="ms-1 size-3" aria-hidden="true" />
          </Button>
        </Link>
      </div>

      {continueProject ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <ProjectThumb project={continueProject} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {t("projects.continue")}
              </p>
              <p className="truncate text-sm font-semibold">{continueProject.title}</p>
            </div>
          </div>
          <Link href={`/projects/${continueProject._id}`}>
            <Button size="sm" className="h-8 rounded-lg px-3 text-xs">
              {t("projects.resume")}{' '}
              <DirIcon name="ArrowRight" className="ms-1 size-3" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      ) : null}

      <DashboardDataState
        isLoading={isLoading}
        error={isError ? new Error(t("projects.error")) : null}
        isEmpty={filtered.length === 0}
        emptyTitle={
          status === "all"
            ? t("projects.emptyAllTitle")
            : t("projects.emptyStatusTitle", {
                status: t(PROJECT_STATUS_KEYS[status as ProjectStatus]).toLowerCase(),
              })
        }
        emptyDescription={
          status === "all"
            ? t("projects.emptyAllDescription")
            : t("projects.emptyStatusDescription")
        }
        emptyIcon={FileText}
        emptyAction={{
          label: t("projects.emptyAction"),
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
        <ul aria-label={t("projects.listAria")} className="divide-y divide-border/40">
          {filtered.slice(0, 8).map((project) => (
            <li key={project._id}>
              <ProjectRow project={project} />
            </li>
          ))}
        </ul>
      </DashboardDataState>
    </div>
  )
}

function AnalyticsWidget({ lockedReason, upgradeHref }: { lockedReason?: string; upgradeHref?: string }) {
  const t = useTranslations("dashboard")
  const { data, isLoading, isError, refetch } = useDashboardStats()

  // A locked widget explains itself even when there is no data to show —
  // otherwise "no activity yet" would hide the actual reason it is unavailable.
  if (lockedReason) {
    return (
      <UpgradePrompt
        title={lockedReason}
        description={t("analytics.lockedDescription")}
        feature="analytics.advanced"
        href={upgradeHref ?? "/settings/billing"}
      />
    )
  }

  return (
    <DashboardDataState
      isLoading={isLoading}
      error={isError ? new Error(t("analytics.error")) : null}
      isEmpty={(data?.trendVelocity.length ?? 0) === 0}
      emptyTitle={t("analytics.emptyTitle")}
      emptyDescription={t("analytics.emptyDescription")}
      emptyIcon={BarChart3}
      onRetry={() => void refetch()}
      loadingFallback={<Skeleton className="h-48 w-full rounded-xl" />}
    >
      <CreationTrendChart data={data?.trendVelocity ?? []} />
    </DashboardDataState>
  )
}

// ─── Main view ──────────────────────────────────────────────────────────────

export function DashboardView() {
  const t = useTranslations("dashboard")
  const [status, setStatus] = React.useState<StatusFilter>("all")

  const statsQuery = useDashboardStats()
  const preferencesQuery = useDashboardPreferences()
  const updatePreferences = useUpdateDashboardPreferences()
  const billing = useBillingSummary()

  const preferences = preferencesQuery.data ?? EMPTY_PREFERENCES
  const widgets = visibleWidgets(preferences)
  const { locked, reasonKey, upgradeHref } = widgetLock(
    "analytics",
    hasFeature(billing.data, "analytics.advanced")
  )

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
        return <DashboardWidget id="status" />
      case "platforms":
        return <DashboardWidget id="platforms" />
      case "trending":
        return <DashboardWidget id="trending" />
      case "activity":
        return <DashboardWidget id="activity" />
      case "upcoming":
        return <DashboardWidget id="upcoming" />
      case "quickActions":
        return <DashboardWidget id="quickActions" />
      case "analytics":
        return (
          <AnalyticsWidget
            lockedReason={locked && reasonKey ? t(reasonKey) : undefined}
            upgradeHref={upgradeHref}
          />
        )
      case "health":
        return <DashboardWidget id="health" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("header.title")}
        description={t("header.description")}
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
                <Plus className="me-1.5 size-3.5" aria-hidden="true" />
                {t("header.newProject")}
              </Button>
            </Link>
          </>
        }
      />

      {preferencesQuery.isError ? (
        <p className="text-xs text-muted-foreground">{t("hidden.preferencesError")}</p>
      ) : null}

      {widgets.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border p-12 text-center">
          <LayoutDashboard className="size-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold">{t("hidden.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("hidden.description")}</p>
          </div>
          <Button onClick={() => updatePreferences.mutate([])}>{t("hidden.showAll")}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {widgets.map((id) => (
            <section key={id} className={WIDGET_SPAN[id]}>
              {id === "stats" || id === "projects" ? (
                <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {id === "stats" ? t("metrics.heading") : t("projects.heading")}
                  </h2>
                  {renderWidget(id)}
                </div>
              ) : (
                <WidgetCard
                  id={id}
                  title={t(WIDGET_LABEL_KEYS[id])}
                  description={
                    id === "analytics" || id === "health"
                      ? t(WIDGET_DESCRIPTION_KEYS[id])
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
        {t("footer.prompt")}{" "}
        <Link href="/onboarding?edit=1" className="font-medium text-primary hover:underline">
          {t("footer.link")}
        </Link>{" "}
        {t("footer.tail")}
      </p>
    </div>
  )
}
