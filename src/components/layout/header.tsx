"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useSyncExternalStore } from "react"

import {
  Plus, Search, Sun, Moon, Monitor,
  ChevronRight,
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

import { CommandMenu } from "./command-menu"
import { UserButton } from "./user-button"
import { NotificationBell } from "@/features/notifications/components/notification-bell"
import { useTheme } from "next-themes"
import { QUICK_ACTIONS, ROUTE_LABELS } from "@/lib/navigation"
import { useBreadcrumbStore } from "@/store/breadcrumb-store"

function useBreadcrumbs() {
  const pathname = usePathname()
  const projectId = useBreadcrumbStore((state) => state.projectId)
  const projectTitle = useBreadcrumbStore((state) => state.projectTitle)
  const segments = pathname.split("/").filter(Boolean)

  return segments.map((seg, i) => ({
    // A project id is not a label. The workspace registers the loaded title so
    // the breadcrumb reads "Projects / My video" instead of the raw ObjectId.
    label:
      projectTitle && seg === projectId
        ? projectTitle
        : ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }))
}

const emptySubscribe = () => () => {}

function ThemeCycler() {
  const { theme, setTheme } = useTheme()

  // The resolved theme is unknown on the server, so subscribe to a no-op store
  // until hydration completes. This replaces a `mounted` flag set from an effect,
  // which triggered a cascading re-render on every header mount.
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark"
  const icon =
    theme === "dark" ? <Moon className="w-4 h-4" /> :
    theme === "light" ? <Sun className="w-4 h-4" /> :
    <Monitor className="w-4 h-4" />

  if (!hydrated) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 max-md:h-11 max-md:w-11 text-muted-foreground hover:text-foreground transition-colors"
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
      className="h-9 w-9 max-md:h-11 max-md:w-11 text-muted-foreground hover:text-foreground transition-colors"
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

  // The palette owns its open state; a synthetic ⌘K event is the shared
  // open path for both the mobile button and the desktop search field.
  const openCmd = useCallback(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    )
  }, [])

  const newProject = QUICK_ACTIONS[0]

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
          <SidebarTrigger className="shrink-0 max-md:size-11 text-muted-foreground hover:text-foreground transition-colors" />

          {/* Breadcrumbs — hidden on small screens */}
          {breadcrumbs.length > 0 && (
            <Breadcrumb className="hidden sm:flex">
              <BreadcrumbList>
                {breadcrumbs.map((crumb) => (
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
          aria-label="Search workspace"
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

          {/* Mobile-only palette access — ⌘K is not a phone gesture. */}
          <Button
            variant="ghost"
            size="icon"
            onClick={openCmd}
            aria-label="Search workspace"
            className="md:hidden size-11 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-4 h-4" />
          </Button>

          {/* Primary action — always visible, per the brief. */}
          <Button
            asChild
            size="sm"
            className="
              h-9 max-md:h-11 max-md:px-3 px-3 gap-1.5 rounded-lg
              bg-primary text-primary-foreground text-xs font-semibold
              hover:bg-primary/90 active:scale-[0.97]
              transition-all shadow-sm hover:shadow-glow
            "
          >
            <Link href={newProject.url} aria-label={newProject.title}>
              <Plus className="w-3.5 h-3.5" />
              <span className="max-md:hidden">{newProject.title}</span>
            </Link>
          </Button>

          {/* Create dropdown — the remaining quick actions. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label="Create"
                className="
                  h-9 max-md:h-11 px-3 gap-1.5 rounded-lg
                  text-xs font-semibold
                "
              >
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Quick Create</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {QUICK_ACTIONS.map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  className="gap-2 cursor-pointer"
                  onClick={() => router.push(action.url)}
                >
                  <action.icon className="w-4 h-4 text-primary" />
                  {action.title}
                  <kbd className="ml-auto text-[10px] font-mono text-muted-foreground tracking-wider">
                    G&thinsp;{action.shortcutKey.toUpperCase()}
                  </kbd>
                </DropdownMenuItem>
              ))}
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
