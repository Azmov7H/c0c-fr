"use client"

import React from "react"
import Link from "next/link"
import {
  ArrowRight, FileText, Play, Plus, TrendingUp,
  Zap, CheckCircle2, Users, BarChart3,
  Lightbulb, Sparkles, Calendar, Hash, MoreHorizontal,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard"
import { useRecentActivity } from "@/features/dashboard/hooks/use-dashboard"
import { usePlannerEvents } from "@/features/planner/hooks/use-planner"
import { formatDistanceToNow } from "date-fns"

// ─── Metric Card ─────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, trend, trendUp, icon: Icon, color, highlighted,
}: {
  label: string; value: string; sub?: string; trend: string; trendUp: boolean;
  icon: React.ElementType; color: string; highlighted?: boolean;
}) {
  return (
    <Card className={
      highlighted
        ? "relative overflow-hidden border-primary/20 bg-primary/5 shadow-glow"
        : "bg-card border-border/50 hover:border-primary/20 hover:shadow-premium transition-all duration-200 group"
    }>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </CardTitle>
        <div className={`p-2 rounded-lg ${highlighted ? "bg-primary/20" : "bg-muted/60 group-hover:bg-primary/10 transition-colors"}`}>
          <Icon className={`h-3.5 w-3.5 ${color}`} />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-black tracking-tight">{value}</span>
          {sub && <span className="text-sm text-muted-foreground font-medium">{sub}</span>}
        </div>
        <p className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
          <span className={trendUp ? "text-emerald-500" : "text-rose-500"}>
            {trendUp ? "↑" : "↓"}
          </span>
          {trend}
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Kanban Item ──────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string }> = {
  Scripting: { label: "Scripting", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  Editing: { label: "Editing", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  Scheduled: { label: "Scheduled", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  "In Progress": { label: "In Progress", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
}

// ─── Main View ────────────────────────────────────────────────────────────────
export function DashboardView() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(5)
  const { data: plannerData } = usePlannerEvents({ limit: 3, status: 'pending' })

  const overview = stats?.overview
  const platformStats = stats?.projectsByPlatform
  const trendVelocity = stats?.trendVelocity || []
  const calendarItems = plannerData?.data || []

  const quickTools = [
    { title: "Generate Script", sub: "AI Content Engine", icon: Zap, color: "bg-primary/10 text-primary", href: "/scripts" },
    { title: "Explore Trends", sub: "Global Intelligence", icon: Lightbulb, color: "bg-amber-500/10 text-amber-500", href: "/trends" },
    { title: "Analyze Performance", sub: "Creator Analytics", icon: BarChart3, color: "bg-emerald-500/10 text-emerald-500", href: "/analytics" },
    { title: "Team Overview", sub: "Workspace Collaboration", icon: Users, color: "bg-purple-500/10 text-purple-500", href: "/team" },
  ]

  const hashtags = ["#AIContent", "#ViralStrategy", "#ContentEngine", "#CreatorTips", "#Trending2026", "#ShortForm"]

  if (statsLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="lg:col-span-8 h-72 rounded-xl" />
          <Skeleton className="lg:col-span-4 h-72 rounded-xl" />
        </div>
      </div>
    )
  }

  const metrics = [
    { label: "Total Projects", value: String(overview?.totalProjects || 0), trend: "All time", trendUp: true, icon: FileText, color: "text-blue-500" },
    { label: "Active", value: String(overview?.activeProjects || 0), trend: "In progress", trendUp: true, icon: Zap, color: "text-amber-500" },
    { label: "Completed", value: String(overview?.completedProjects || 0), trend: "Finished", trendUp: true, icon: CheckCircle2, color: "text-emerald-500", highlighted: true },
    { label: "Scripts", value: String(overview?.totalScripts || 0), trend: "Generated", trendUp: true, icon: BarChart3, color: "text-primary" },
  ]

  return (
    <div className="space-y-8">

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Workspace Overview</p>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            Good morning, Creator 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s the latest performance of your content.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-border/60 hover:bg-muted group">
            <Play className="w-3.5 h-3.5 mr-1.5 text-primary group-hover:scale-110 transition-transform" />
            Tutorial
          </Button>
          <Link href="/projects/new">
            <Button size="sm" className="h-9 px-4 rounded-xl bg-primary hover:shadow-glow transition-all active:scale-[0.98]">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Middle Row: Trend insights + Quick Tools */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* Trend Velocity */}
        <Card className="lg:col-span-8 border-border/50 bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <div>
              <CardTitle className="text-base font-bold">Trend Velocity</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Projects created over time</p>
            </div>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-semibold text-[10px]">
              ↑ Live
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {trendVelocity.length > 0 ? (
              <div className="h-48 flex items-end gap-1 px-6 pb-6 pt-4">
                {trendVelocity.map((point, i) => {
                  const maxCount = Math.max(...trendVelocity.map(t => t.count), 1)
                  const heightPercent = (point.count / maxCount) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-sm bg-gradient-to-t from-primary/40 to-primary/80 transition-all"
                        style={{ height: `${Math.max(heightPercent, 5)}%` }}
                      />
                      <span className="text-[8px] text-muted-foreground">{point.date.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No data yet. Create your first project!
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Quick Tools */}
        <Card className="lg:col-span-4 border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Quick Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {quickTools.map((tool) => (
              <Link key={tool.title} href={tool.href}>
                <div className="flex items-center p-3 rounded-xl border border-border/40 hover:border-primary/30 hover:bg-muted/40 cursor-pointer transition-all group">
                  <div className={`${tool.color} p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform shrink-0`}>
                    <tool.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{tool.title}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 truncate">{tool.sub}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Projects + Calendar + Hashtags */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* Recent Projects */}
        <Card className="lg:col-span-8 border-border/50 bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <CardTitle className="text-base font-bold">Recent Activity</CardTitle>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 h-8 px-3 text-xs">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {activityLoading ? (
              <div className="divide-y divide-border/40">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="divide-y divide-border/40">
                {recentActivity.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {item.type === "project" ? <FileText className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.type} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold capitalize"
                    >
                      {item.status || "new"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No recent activity. Start creating content!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column: Calendar + Hashtags */}
        <div className="lg:col-span-4 space-y-4">

          {/* Content Calendar */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="border-b border-border/50 pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Upcoming Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {calendarItems.length > 0 ? (
                calendarItems.map((item: any) => (
                  <div key={item._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer group">
                    <div className="text-center shrink-0 w-10">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">{new Date(item.scheduledDate).toLocaleString('default', { month: 'short' })}</p>
                      <p className="text-base font-black leading-none">{new Date(item.scheduledDate).getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.platform && (
                          <Badge variant="outline" className="text-[9px] font-semibold px-1.5 h-4 border-border/40 capitalize">{item.platform}</Badge>
                        )}
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{item.status}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No upcoming events
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hashtag Suggestions */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="border-b border-border/50 pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-primary" />
                Suggested Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-[11px] rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-all font-semibold"
                    onClick={() => navigator.clipboard.writeText(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 font-medium">Click to copy</p>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* System Status Bar */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">All Systems Operational</p>
        <span className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60">Connected to backend</span>
      </div>

    </div>
  )
}
