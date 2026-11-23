"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Clock3, Flame, LayoutGrid, List } from "lucide-react"
import { useTranslations } from "next-intl"

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

const SCOPES = ["global", "youtube", "tiktok", "instagram"] as const
const CATEGORIES = [
  "tech", "gaming", "finance", "health-fitness", "food", "education",
  "entertainment", "lifestyle", "business", "science", "diy", "sports", "uncategorised",
] as const

function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? "bg-negative" : score >= 75 ? "bg-warning" : "bg-primary"
  return (
    <div dir="ltr" className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-right font-mono text-xs font-bold">{score}</span>
    </div>
  )
}

function TopicCard({ topic }: { topic: TrendTopic }) {
  const t = useTranslations("trends")
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
                <Badge variant="outline" className="h-5 border-border/50 px-2 text-[10px] font-semibold text-muted-foreground">
                  {t.has(`categories.${topic.category}` as never) ? t(`categories.${topic.category}` as never) : topic.category}
                </Badge>
              )}
              <Badge variant="outline" className="h-5 border-border/50 px-2 text-[10px] font-semibold">{t("badges.measured")}</Badge>
            </div>
          </div>
          <div className="shrink-0 text-end">
            <p className={`text-sm font-bold ${topic.growthPct > 0 ? "text-success" : "text-negative"}`}>
              {topic.growthPct > 0 ? "+" : ""}{topic.growthPct}%
            </p>
            <p className="text-[10px] text-muted-foreground">{t("topic.inWindow")}</p>
          </div>
        </div>
        <ScoreBar score={topic.viralScore} />
        <p className="text-xs text-muted-foreground">
          {t("topic.meta", { projects: topic.projectCount, creators: topic.creatorCount, demand: topic.components.demand })}
        </p>
      </CardContent>
    </Card>
  )
}

export function TrendsContent() {
  const t = useTranslations("trends")
  const [scope, setScope] = useState<(typeof SCOPES)[number]>("global")
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
          <h1 className="text-3xl font-extrabold tracking-tight">{t("page.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("page.description")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={scope} onValueChange={(v) => setScope(v as (typeof SCOPES)[number])}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border/60 text-xs" aria-label={t("controls.platform")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPES.map((s) => (
                <SelectItem key={s} value={s}>{t(`scopes.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(windowDays)} onValueChange={(v) => setWindowDays(Number(v) as TrendWindow)}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border/60 text-xs" aria-label={t("controls.timeWindow")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t("windows.7")}</SelectItem>
              <SelectItem value="30">{t("windows.30")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border/60 text-xs" aria-label={t("controls.category")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("controls.allCategories")}</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{t(`categories.${c}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex overflow-hidden rounded-xl border border-border/60">
            <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-none ${view === "grid" ? "bg-muted" : ""}`} onClick={() => setView("grid")} aria-label={t("controls.gridView")} aria-pressed={view === "grid"}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-none ${view === "list" ? "bg-muted" : ""}`} onClick={() => setView("list")} aria-label={t("controls.listView")} aria-pressed={view === "list"}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <DataState
        isLoading={feed.isLoading}
        error={feed.isError ? new Error(t("error.loadFailed")) : null}
        isEmpty={!unavailable && topics.length === 0}
        emptyTitle={t("empty.title")}
        emptyDescription={t("empty.description")}
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
              <Badge variant="outline">{t("badges.measuredProvider", { provider: feed.data.provider })}</Badge>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {feed.data.freshness === "fresh" ? t("freshness.fresh") : feed.data.freshness === "stale" ? t("freshness.stale") : t("freshness.cold")}
                {feed.data.fetchedAt ? ` · ${t("freshness.measuredAt", { date: feed.data.fetchedAt })}` : ` · ${t("freshness.providerUnavailable")}`}
              </span>
              {feed.data.providerStatus === "stale" && (
                <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">{t("badges.staleSnapshot")}</Badge>
              )}
            </div>

            {unavailable ? (
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="space-y-2 p-6">
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                    {t("unavailable.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("unavailable.description")}</p>
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
                <div dir="ltr" className="flex items-center gap-4 border-b border-border/50 bg-muted/40 px-4 py-2.5">
                  <div className="flex-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("list.topic")}</div>
                  <div className="w-32 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("list.score")}</div>
                  <div className="w-16 text-end text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("list.growth")}</div>
                </div>
                {topics.map((topic) => (
                  <div dir="ltr" key={`${topic.topic}-${topic.rank}`} className="flex items-center gap-4 border-b border-border/40 px-4 py-3 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{topic.topic}</p>
                      <p className="text-[10px] text-muted-foreground">{topic.platforms.join(", ") || t("list.allPlatforms")}{topic.category ? ` · ${t.has(`categories.${topic.category}` as never) ? t(`categories.${topic.category}` as never) : topic.category}` : ""}</p>
                    </div>
                    <div className="w-32"><ScoreBar score={topic.viralScore} /></div>
                    <div className={`w-16 text-end text-sm font-bold ${topic.growthPct > 0 ? "text-success" : "text-negative"}`}>
                      {topic.growthPct > 0 ? "+" : ""}{topic.growthPct}%
                    </div>
                  </div>
                ))}
              </Card>
            )}
            <p className="text-xs text-muted-foreground">
              {t("disclaimer", { path: t("disclaimerPath") })}
            </p>
          </>
        )}
      </DataState>
    </div>
  )
}
