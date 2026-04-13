"use client"

import { useState, useMemo } from "react"
import {
  TrendingUp, Filter, ExternalLink, Zap,
  ChevronUp, ChevronDown, LayoutGrid, List, X,
  Flame, ArrowUpRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { useTrends } from "../hooks/use-trends"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Trend {
  id: string
  topic: string
  category: string
  platform: string
  viralScore: number
  growth24h: number
  isRising: boolean
  description: string
  relatedTopics: string[]
}

// ─── Development Mock Data (used only when API is unavailable) ────────────────
const MOCK_TRENDS: Trend[] = process.env.NODE_ENV === 'development' ? [
  { id: "1", topic: "AI Video Generation", category: "Tech", platform: "YouTube", viralScore: 96, growth24h: +42, isRising: true, description: "AI tools generating full videos from text prompts are exploding in views.", relatedTopics: ["#AIVideo", "#Sora", "#RunwayML"] },
  { id: "2", topic: "POV Finance Hacks", category: "Finance", platform: "TikTok", viralScore: 89, growth24h: +31, isRising: true, description: "First-person financial advice videos targeting Gen Z investors.", relatedTopics: ["#FinanceTok", "#MoneyTips", "#Investing"] },
  { id: "3", topic: "Pixel Art Nostalgia", category: "Gaming", platform: "Instagram", viralScore: 74, growth24h: +18, isRising: true, description: "Retro pixel art content seeing a massive resurgence across platforms.", relatedTopics: ["#PixelArt", "#RetroGaming", "#Indie"] },
  { id: "4", topic: "Quiet Luxury Lifestyle", category: "Lifestyle", platform: "YouTube", viralScore: 82, growth24h: +25, isRising: true, description: "Minimalist, refined content about high-quality living without logos.", relatedTopics: ["#QuietLuxury", "#Minimalism", "#Aesthetic"] },
  { id: "5", topic: "Startup Failure Stories", category: "Business", platform: "TikTok", viralScore: 91, growth24h: +55, isRising: true, description: "Raw honest accounts of startup failures performing better than success stories.", relatedTopics: ["#FounderStory", "#Startup", "#Failure"] },
  { id: "6", topic: "Micro SaaS Income", category: "Tech", platform: "YouTube", viralScore: 78, growth24h: +14, isRising: false, description: "Solo founders documenting their micro-SaaS MRR journeys.", relatedTopics: ["#MicroSaaS", "#IndieHacker", "#SaaS"] },
  { id: "7", topic: "GRWM Study With Me", category: "Education", platform: "Instagram", viralScore: 67, growth24h: +8, isRising: false, description: "Combination of get-ready-with-me and study session formats.", relatedTopics: ["#GRWM", "#StudyWithMe", "#Productivity"] },
  { id: "8", topic: "5-Minute Meal Prep", category: "Food", platform: "TikTok", viralScore: 85, growth24h: +33, isRising: true, description: "Ultra-fast meal prep videos with satisfying transitions.", relatedTopics: ["#MealPrep", "#QuickRecipes", "#FoodTok"] },
] : [];

const CATEGORIES = ["All", "Tech", "Finance", "Gaming", "Lifestyle", "Business", "Education", "Food"]
const PLATFORMS = ["All", "YouTube", "TikTok", "Instagram"]

function ViralScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? "bg-rose-500" : score >= 75 ? "bg-amber-500" : "bg-primary"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono font-bold w-8 text-right">{score}</span>
    </div>
  )
}

function TrendCard({ trend, onClick }: { trend: Trend; onClick: () => void }) {
  return (
    <Card
      className="border-border/50 bg-card hover:border-primary/30 hover:shadow-premium transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {trend.isRising && (
                <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">{trend.topic}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[10px] h-5 px-2 font-semibold border-border/50">{trend.platform}</Badge>
              <Badge variant="outline" className="text-[10px] h-5 px-2 font-semibold border-border/50 text-muted-foreground">{trend.category}</Badge>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-sm font-bold ${trend.growth24h > 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {trend.growth24h > 0 ? "+" : ""}{trend.growth24h}%
            </p>
            <p className="text-[10px] text-muted-foreground">24h</p>
          </div>
        </div>
        <ViralScoreBar score={trend.viralScore} />
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{trend.description}</p>
      </CardContent>
    </Card>
  )
}

function TrendRow({ trend, onClick }: { trend: Trend; onClick: () => void }) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group border-b border-border/40 last:border-0"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0 flex items-center gap-3">
        {trend.isRising && <Flame className="w-4 h-4 text-rose-500 shrink-0" />}
        <div className="min-w-0">
          <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{trend.topic}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-semibold border-border/50">{trend.platform}</Badge>
            <span className="text-[10px] text-muted-foreground">{trend.category}</span>
          </div>
        </div>
      </div>
      <div className="w-32 shrink-0">
        <ViralScoreBar score={trend.viralScore} />
      </div>
      <div className={`w-16 text-right text-sm font-bold shrink-0 ${trend.growth24h > 0 ? "text-emerald-500" : "text-rose-500"}`}>
        {trend.growth24h > 0 ? "+" : ""}{trend.growth24h}%
      </div>
      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TrendsContent() {
  const router = useRouter()
  const [category, setCategory] = useState("All")
  const [platform, setPlatform] = useState("All")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null)

  // Try to fetch real data from API, fall back to mock in development
  const { data: apiTrends, isLoading } = useTrends(platform === "All" ? undefined : platform)
  const hasApiData = apiTrends && apiTrends.length > 0
  const trends: Trend[] = hasApiData
    ? apiTrends.map((t: any) => ({
        id: t._id || t.id,
        topic: t.topic || t.title,
        category: t.category || "General",
        platform: t.platform || "YouTube",
        viralScore: t.viralScore || 50,
        growth24h: t.growth24h || 0,
        isRising: t.isRising ?? true,
        description: t.description || "",
        relatedTopics: t.relatedTopics || [],
      }))
    : MOCK_TRENDS

  const filtered = useMemo(() =>
    trends.filter((t) =>
      (category === "All" || t.category === category) &&
      (platform === "All" || t.platform === platform)
    ).sort((a, b) => b.viralScore - a.viralScore),
    [trends, category, platform]
  )

  if (isLoading && !MOCK_TRENDS.length) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Ideas & Trends</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover what&apos;s viral in your niche right now
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filters */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border/60 text-xs">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border/60 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center border border-border/60 rounded-xl overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-none ${view === "grid" ? "bg-muted" : ""}`}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-none ${view === "list" ? "bg-muted" : ""}`}
              onClick={() => setView("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active filters */}
      {(category !== "All" || platform !== "All") && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Filters:</span>
          {category !== "All" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => setCategory("All")}>
              {category} <X className="w-3 h-3" />
            </Badge>
          )}
          {platform !== "All" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => setPlatform("All")}>
              {platform} <X className="w-3 h-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((trend) => (
            <TrendCard key={trend.id} trend={trend} onClick={() => setSelectedTrend(trend)} />
          ))}
        </div>
      ) : (
        <Card className="border-border/50 overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/40 border-b border-border/50">
            <div className="flex-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Topic</div>
            <div className="w-32 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Viral Score</div>
            <div className="w-16 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">24h</div>
            <div className="w-4" />
          </div>
          {filtered.map((trend) => (
            <TrendRow key={trend.id} trend={trend} onClick={() => setSelectedTrend(trend)} />
          ))}
        </Card>
      )}

      {/* Side Sheet */}
      <Sheet open={!!selectedTrend} onOpenChange={(o) => !o && setSelectedTrend(null)}>
        <SheetContent className="w-[380px] sm:w-[480px] flex flex-col gap-0 p-0 overflow-y-auto">
          {selectedTrend && (
            <>
              <SheetHeader className="p-6 border-b border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  {selectedTrend.isRising && <Flame className="w-5 h-5 text-rose-500" />}
                  <Badge variant="outline" className="text-xs">{selectedTrend.platform}</Badge>
                  <Badge variant="outline" className="text-xs text-muted-foreground">{selectedTrend.category}</Badge>
                </div>
                <SheetTitle className="text-xl font-bold leading-tight">{selectedTrend.topic}</SheetTitle>
                <SheetDescription className="text-sm mt-2">{selectedTrend.description}</SheetDescription>
              </SheetHeader>

              <div className="p-6 space-y-5 flex-1">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Viral Score</p>
                    <p className="text-3xl font-black mt-1">{selectedTrend.viralScore}</p>
                    <ViralScoreBar score={selectedTrend.viralScore} />
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">24h Growth</p>
                    <p className={`text-3xl font-black mt-1 ${selectedTrend.growth24h > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {selectedTrend.growth24h > 0 ? "+" : ""}{selectedTrend.growth24h}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {selectedTrend.isRising ? "Rising fast 🔥" : "Decelerating"}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Related Topics */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Related Hashtags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrend.relatedTopics.map((tag) => (
                      <Badge key={tag} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer font-semibold">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* CTA */}
                <Button
                  className="w-full h-11 rounded-xl bg-primary hover:shadow-glow transition-all font-bold"
                  onClick={() => {
                    setSelectedTrend(null)
                    router.push("/scripts")
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Script from Trend
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </div>
  )
}
