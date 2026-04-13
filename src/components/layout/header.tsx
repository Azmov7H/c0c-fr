"use client"

import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import {
  Bell, Plus, Search, Sun, Moon, Monitor,
  FileText, Upload, Zap, ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { CommandMenu } from "./command-menu"
import { UserButton } from "./user-button"
import { NotificationBell } from "@/features/notifications/components/notification-bell"
import { useTheme } from "next-themes"

// Map paths → breadcrumb labels
const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  trends: "Ideas & Trends",
  scripts: "Script Generator",
  planner: "Content Planner",
  titles: "Title Generator",
  hashtags: "Hashtag Generator",
  media: "Media Library",
  audio: "Audio Effects",
  thumbnails: "Thumbnail Studio",
  templates: "Templates",
  analytics: "Analytics",
  team: "Team",
  settings: "Settings",
  new: "New",
}

function useBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  return segments.map((seg, i) => ({
    label: pathLabels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }))
}

function ThemeCycler() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark"
  const icon =
    theme === "dark" ? <Moon className="w-4 h-4" /> :
    theme === "light" ? <Sun className="w-4 h-4" /> :
    <Monitor className="w-4 h-4" />

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Toggle theme"
      >
        <Monitor className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => setTheme(next)}
      aria-label="Toggle theme"
    >
      {icon}
    </Button>
  )
}

export function Header() {
  const router = useRouter()
  const breadcrumbs = useBreadcrumbs()

  const [cmdOpen, setCmdOpen] = useState(false)

  const openCmd = useCallback(() => {
    // dispatch a keyboard event to trigger CommandMenu
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    )
  }, [])

  return (
    <>
      <CommandMenu />

      <header
        className="
          sticky top-0 z-40
          flex h-14 items-center justify-between gap-4
          border-b border-border/60
          bg-background/80 backdrop-blur-xl
          px-4 md:px-6
        "
      >
        {/* Left: Trigger + Breadcrumbs */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" />

          {/* Breadcrumbs — hidden on small screens */}
          {breadcrumbs.length > 0 && (
            <Breadcrumb className="hidden sm:flex">
              <BreadcrumbList>
                {breadcrumbs.map((crumb, i) => (
                  <BreadcrumbItem key={crumb.href}>
                    {!crumb.isLast ? (
                      <>
                        <BreadcrumbLink
                          href={crumb.href}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                        <BreadcrumbSeparator>
                          <ChevronRight className="w-3 h-3" />
                        </BreadcrumbSeparator>
                      </>
                    ) : (
                      <BreadcrumbPage className="text-xs font-semibold text-foreground">
                        {crumb.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        {/* Center: Search */}
        <Button
          variant="outline"
          onClick={openCmd}
          className="
            hidden md:flex h-9 w-full max-w-xs
            items-center justify-between gap-2
            rounded-xl bg-muted/30 border-border/60
            text-muted-foreground text-sm
            hover:bg-muted/60 transition-all duration-200
          "
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">Search workspace...</span>
          </div>
          <kbd className="hidden lg:flex items-center h-5 px-1.5 rounded-md border bg-background text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* Create CTA */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="
                  hidden sm:flex h-8 px-3 gap-1.5 rounded-lg
                  bg-primary text-primary-foreground text-xs font-semibold
                  hover:bg-primary/90 active:scale-[0.97]
                  transition-all shadow-sm hover:shadow-glow
                "
              >
                <Plus className="w-3.5 h-3.5" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Quick Create</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => router.push("/scripts")}
              >
                <FileText className="w-4 h-4 text-primary" />
                New Script
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => router.push("/projects/new")}
              >
                <Zap className="w-4 h-4 text-amber-500" />
                New Project
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => router.push("/media")}
              >
                <Upload className="w-4 h-4 text-emerald-500" />
                Upload Media
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <NotificationBell />

          {/* Theme Switcher */}
          <ThemeCycler />

          {/* Divider */}
          <div className="h-5 w-px bg-border/60 mx-1" />

          {/* User */}
          <UserButton />
        </div>
      </header>
    </>
  )
}