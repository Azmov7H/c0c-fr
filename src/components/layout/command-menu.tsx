"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard, FileText, Lightbulb, Folder,
  BarChart3, Users, Settings, Search, Music, Image, Hash, Type, CalendarDays,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

const commands = [
  {
    group: "Navigation",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Projects", url: "/projects", icon: FileText },
      { title: "Ideas & Trends", url: "/trends", icon: Lightbulb },
      { title: "Script Generator", url: "/scripts", icon: FileText },
      { title: "Content Planner", url: "/planner", icon: CalendarDays },
      { title: "Title Generator", url: "/titles", icon: Type },
      { title: "Hashtag Generator", url: "/hashtags", icon: Hash },
      { title: "Media Library", url: "/media", icon: Folder },
      { title: "Audio Effects", url: "/audio", icon: Music },
      { title: "Thumbnail Studio", url: "/thumbnails", icon: Image },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
      { title: "Team", url: "/team", icon: Users },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
]

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const runCommand = useCallback(
    (cb: () => void) => {
      setOpen(false)
      cb()
    },
    []
  )

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, actions..." />
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <Search className="w-8 h-8 opacity-30" />
              <p className="text-sm">No results found.</p>
            </div>
          </CommandEmpty>
          {commands.map((group, i) => (
            <div key={group.group}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group.group}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.url}
                    value={item.title}
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
        </CommandList>
      </CommandDialog>
    </>
  )
}
