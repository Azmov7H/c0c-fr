"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Clock3, Flame, LayoutGrid, List } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataState } from "@/components/shared/data-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TrendWindow, TrendTopic } from "../types"
import { useGlobalTrendFeed } from "../hooks/use-trends"

const SCOPES = [
  { value: "global", label: "All platforms" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
] as const

const CATEGORIES = [
  "tech",
  "gaming",
  "finance",
  "health-fitness",
  "food",
  "education",
  "entertainment",
  "lifestyle",
  "business",
  "science",
  "diy",
  "sports",
  "uncategorised",
]

function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? "bg-negative" : score >= 75 ? "bg-warning" : "bg-primary"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-right font-mono text-xs font-bold">{score}</span>
    </div>
  )
}

function TopicCard({ topic }: { topic: TrendTopic }) {
  return (
    <Card className="border-border/50 bg-card">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5">
              {topic.growthPct > 0 && <Flame className="h-3.5 w-3.5 shrink-0 text-negative" aria-hidden="true" />}
              <p className="truncate text-sm font-bold">{topic.topic}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {topic.platforms.map((p) => (
                <Badge key={p} variant="outline" className="h-5 border-border/50 px-2 text-[10px] font-semibold capitalize">{p}</Badge>
              ))}
              {topic.category && (
                <Badge variant="outline" className="h-5 border-border/50 px-2 text-[10px] font-semibold text-muted-foreground">{topic.category}</Badge>
              )}
              <Badge variant="outline" className="h-5 border-border/50 px-2 text-[10px] font-semibold">Measured</Badge>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-sm font-bold ${topic.growthPct > 0 ? "text-success" : "text-negative"}`}>
              {topic.growthPct > 0 ? "+" : ""}{topic.growthPct}%
            </p>
            <p className="text-[10px] text-muted-foreground">in window</p>
          </div>
        </div>
        <ScoreBar score={topic.viralScore} />
        <p className="text-xs text-muted-foreground">
          {topic.projectCount} projects · {topic.creatorCount} creators · {topic.components.demand} demand
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * P03 — the measured feed is the default surface. Projected AI reports no
 * longer render here as live trends (they live under `/trends/reports` with
 * an explicit `projected` label). No dev mock data is used.
 */
export function TrendsContent() {
  const [scope, setScope] = useState<(typeof SCOPES)[number]["value"]>("global")
  const [windowDays, setWindowDays] = useState<TrendWindow>(7)
  const [category, setCategory] = useState<string>("all")
  const [view, setView] = useState<"grid" | "list">("grid")

  const feed = useGlobalTrendFeed(scope, windowDays, category === "all" ? undefined : (category as never))
  const topics = useMemo(() => feed.data?.topics ?? [], [feed.data])
  const unavailable = feed.data?.providerStatus === "unavailable"

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Ideas &amp; Trends</h1>
          <p className="mt-1 text-sm text-muted-foreground">What creators are actually working on — measured demand.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={scope} onValueChange={(v) => setScope(v as (typeof SCOPES)[number]["value"])}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border/60 text-xs" aria-label="Platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(windowDays)} onValueChange={(v) => setWindowDays(Number(v) as TrendWindow)}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border/60 text-xs" aria-label="Time window">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border/60 text-xs" aria-label="Category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex overflow-hidden rounded-xl border border-border/60">
            <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-none ${view === "grid" ? "bg-muted" : ""}`} onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-none ${view === "list" ? "bg-muted" : ""}`} onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <DataState
        isLoading={feed.isLoading}
        error={feed.isError ? new Error("Trends could not be loaded.") : null}
        isEmpty={!unavailable && topics.length === 0}
        emptyTitle="No trends for this window"
        emptyDescription="No measured demand in this category yet — try another category or window."
        emptyIcon={Flame}
        onRetry={() => void feed.refetch()}
        loadingFallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[160px]" />
            ))}
          </div>
        }
      >
        {feed.data && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="outline">Measured · {feed.data.provider}</Badge>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {feed.data.freshness === "fresh" ? "Up to date" : feed.data.freshness === "stale" ? "Stale snapshot (shown, not live)" : "Just computed"}
                {feed.data.fetchedAt ? ` · measured ${feed.data.fetchedAt}` : " · provider unavailable"}
              </span>
              {feed.data.providerStatus === "stale" && (
                <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">Stale snapshot</Badge>
              )}
            </div>

            {unavailable ? (
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="space-y-2 p-6">
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                    Provider unavailable
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No measured snapshot exists yet for this scope and the trends provider could not be reached.
                    Trends are currently unavailable — nothing is shown in their place.
                  </p>
                </CardContent>
              </Card>
            ) : view === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {topics.map((topic) => (
                  <TopicCard key={`${topic.topic}-${topic.rank}`} topic={topic} />
                ))}
              </div>
            ) : (
              <Card className="overflow-hidden border-border/50">
                <div className="flex items-center gap-4 border-b border-border/50 bg-muted/40 px-4 py-2.5">
                  <div className="flex-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Topic</div>
                  <div className="w-32 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score</div>
                  <div className="w-16 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Growth</div>
                </div>
                {topics.map((topic) => (
                  <div key={`${topic.topic}-${topic.rank}`} className="flex items-center gap-4 border-b border-border/40 px-4 py-3 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{topic.topic}</p>
                      <p className="text-[10px] text-muted-foreground">{topic.platforms.join(", ") || "all platforms"}{topic.category ? ` · ${topic.category}` : ""}</p>
                    </div>
                    <div className="w-32"><ScoreBar score={topic.viralScore} /></div>
                    <div className={`w-16 text-right text-sm font-bold ${topic.growthPct > 0 ? "text-success" : "text-negative"}`}>
                      {topic.growthPct > 0 ? "+" : ""}{topic.growthPct}%
                    </div>
                  </div>
                ))}
              </Card>
            )}
            <p className="text-xs text-muted-foreground">
              AI-generated reports (under <span className="font-mono">/trends/reports</span>) are projections and are never shown as live trends.
            </p>
          </>
        )}
      </DataState>
    </div>
  )
}
