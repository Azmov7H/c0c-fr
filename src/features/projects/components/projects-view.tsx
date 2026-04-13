"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"

import { Search, Plus, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useProjects } from "@/features/projects/hooks/use-projects"
import { ProjectCard } from "@/components/dashboard/project/ProjectCard"
import { EmptyState } from "@/components/ui/empty-state"

const STATUS_OPTIONS = ["All", "draft", "processing", "completed", "error"]
const PLATFORM_OPTIONS = ["All", "youtube", "tiktok", "instagram", "shorts", "reels"]

export function ProjectsView() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("All")
  const [platform, setPlatform] = useState("All")

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useProjects()

  const projects = useMemo(() => {
    const all = data?.data ?? []
    return all.filter((p: any) => {
      const matchSearch = !debouncedSearch ||
        p.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.idea?.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchStatus = status === "All" || p.status === status
      const matchPlatform = platform === "All" || p.platform === platform
      return matchSearch && matchStatus && matchPlatform
    })
  }, [data, debouncedSearch, status, platform])

  const hasFilters = search || status !== "All" || platform !== "All"

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your content workflows.</p>
        </div>
        <Link href="/projects/new">
          <Button className="h-9 px-4 rounded-xl shadow-premium hover:shadow-glow transition-all">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="projects-search"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl bg-muted/30 border-border/60 focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border/60 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s === "All" ? "All Status" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border/60 text-xs">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_OPTIONS.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p === "All" ? "All Platforms" : p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setSearch(""); setStatus("All"); setPlatform("All") }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (data?.data?.length ?? 0) > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{projects.length}</span> of{" "}
          <span className="font-semibold text-foreground">{data?.data?.length ?? 0}</span> projects
        </p>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Create your first project to start generating AI-powered content."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

    </div>
  )
}
