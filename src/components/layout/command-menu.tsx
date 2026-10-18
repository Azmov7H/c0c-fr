"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, SunMoon, LogOut, FolderKanban } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

import { NAV_GROUPS, QUICK_ACTIONS } from "@/lib/navigation"
import { useProjects } from "@/features/projects/hooks/use-projects"
import { useLogout } from "@/features/auth/hooks/use-auth"
import { useTheme } from "next-themes"

const G_PREFIX_WINDOW_MS = 1200

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return !!target.closest('input, textarea, select, [contenteditable="true"]')
}

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { mutate: logout } = useLogout()

  // Project search — fetched lazily: only while the palette is open.
  const { data: projectsData } = useProjects({ limit: 8 }, { enabled: open })
  const projects = projectsData?.data ?? []

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      if (e.key === "/" && !open) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  // g-prefixed accelerators (g then p → New Project). Skipped while the
  // palette is open — there enter/typeahead own the keyboard — and while
  // typing anywhere else on the page.
  useEffect(() => {
    if (open) return
    let lastG = 0
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      const key = e.key.toLowerCase()
      if (key === "g") {
        lastG = Date.now()
        return
      }
      if (Date.now() - lastG > G_PREFIX_WINDOW_MS) return
      const action = QUICK_ACTIONS.find((a) => a.shortcutKey === key)
      lastG = 0
      if (action) {
        e.preventDefault()
        router.push(action.url)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, router])

  const runCommand = useCallback(
    (cb: () => void) => {
      setOpen(false)
      cb()
    },
    []
  )

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="motion-reduce:animate-none"
      >
        <CommandInput placeholder="Search pages, actions, projects..." />
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <Search className="w-8 h-8 opacity-30" />
              <p className="text-sm">No results found.</p>
            </div>
          </CommandEmpty>

          {NAV_GROUPS.map((group, i) => (
            <div key={group.label}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group.label}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.url}
                    value={`nav-${item.url}`}
                    keywords={[item.title]}
                    onSelect={() => runCommand(() => router.push(item.url))}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}

          <CommandSeparator />
          <CommandGroup heading="Actions">
            {QUICK_ACTIONS.map((action) => (
              <CommandItem
                key={action.id}
                value={`action-${action.id}`}
                keywords={[action.title]}
                onSelect={() => runCommand(() => router.push(action.url))}
                className="flex items-center gap-3 cursor-pointer"
              >
                <action.icon className="w-4 h-4 text-muted-foreground" />
                <span>{action.title}</span>
                <kbd className="ml-auto text-[10px] font-mono text-muted-foreground tracking-wider">
                  G&thinsp;{action.shortcutKey.toUpperCase()}
                </kbd>
              </CommandItem>
            ))}
            <CommandItem
              value="action-toggle-theme"
              keywords={["toggle", "theme", "dark", "light"]}
              onSelect={() =>
                runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))
              }
              className="flex items-center gap-3 cursor-pointer"
            >
              <SunMoon className="w-4 h-4 text-muted-foreground" />
              <span>Toggle Theme</span>
            </CommandItem>
            <CommandItem
              value="action-sign-out"
              keywords={["sign", "out", "logout"]}
              onSelect={() => runCommand(() => logout())}
              className="flex items-center gap-3 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
              <span>Sign out</span>
            </CommandItem>
          </CommandGroup>

          {projects.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Projects">
                {projects.map((project) => (
                  <CommandItem
                    key={project._id}
                    value={`project-${project._id}`}
                    keywords={[project.title]}
                    onSelect={() =>
                      runCommand(() => router.push(`/projects/${project._id}`))
                    }
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <FolderKanban className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{project.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
