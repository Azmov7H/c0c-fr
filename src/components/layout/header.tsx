"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useCallback, useSyncExternalStore } from "react"

import {
  Plus, Search, Sun, Moon, Monitor,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { UserButtonSlot } from "./user-button-slot"
import { useTheme } from "@/components/theme-provider"
import { QUICK_ACTIONS, ROUTE_LABELS } from "@/lib/navigation"
import { useBreadcrumbStore } from "@/store/breadcrumb-store"

/** T20: the bell dropdown is interaction-only; its menu runtime loads on demand. */
const NotificationBell = dynamic(
  () =>
    import("@/features/notifications/components/notification-bell").then(
      (mod) => mod.NotificationBell
    ),
  {
    ssr: false,
    loading: () => (
      <span className="inline-flex size-9 shrink-0 rounded-md" aria-hidden="true" />
    ),
  }
)

/**
 * T20: the palette (cmdk + project search) is opened by Cmd/Ctrl+K, not on
 * first paint. Deferring its chunk keeps cmdk out of the first-load budget
 * while still loading in the background after hydration.
 */
const CommandMenu = dynamic(() => import("./command-menu").then((mod) => mod.CommandMenu), {
  ssr: false,
})

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

          {/* Create menu — the remaining quick actions.
              T20: native <details>, not Radix DropdownMenu. Radix's menu
              pulls Popper (~10 kB gzip) into the authenticated shell on every
              dashboard/workspace first load; this menu is five links and opens
              without any menu runtime. Links keep client-side navigation. */}
          <details className="group relative">
            <summary
              className="inline-flex h-9 max-md:h-11 cursor-pointer list-none items-center rounded-lg border border-input bg-background px-3 text-xs font-semibold shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground [&::-webkit-details-marker]:hidden"
            >
              Create
            </summary>
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              <p className="px-2 py-1.5 text-xs text-muted-foreground">Quick Create</p>
              <div className="my-1 h-px bg-border" />
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.id}
                  href={action.url}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  onClick={(event) => {
                    event.currentTarget.closest('details')?.removeAttribute('open')
                  }}
                >
                  <action.icon className="h-4 w-4 text-primary" />
                  {action.title}
                  <kbd className="ml-auto font-mono text-[10px] tracking-wider text-muted-foreground">
                    G&thinsp;{action.shortcutKey.toUpperCase()}
                  </kbd>
                </Link>
              ))}
            </div>
          </details>

          {/* Notifications */}
          <NotificationBell />

          {/* Theme Switcher */}
          <ThemeCycler />

          {/* Divider */}
          <div className="h-5 w-px bg-border/60 mx-1" />

          {/* User */}
          <UserButtonSlot />
        </div>
      </header>
    </>
  )
}
