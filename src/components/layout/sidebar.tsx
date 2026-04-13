"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"

import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  CalendarDays,
  Type,
  Hash,
  Image,
  Folder,
  Music,
  LayoutTemplate,
  BarChart3,
  Users,
  Settings,
} from "lucide-react"

import Logo from "../logo"
import { ThemeToggle } from "../theme-toggle"
import { UserButton } from "./user-button"
import { useAuthStore } from "@/store/auth-store"

const navGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content Engine",
    items: [
      { title: "Ideas & Trends", url: "/trends", icon: Lightbulb },
      { title: "Script Generator", url: "/scripts", icon: FileText },
      { title: "Content Planner", url: "/planner", icon: CalendarDays },
      { title: "Title Generator", url: "/titles", icon: Type },
      { title: "Hashtag Generator", url: "/hashtags", icon: Hash },
    ],
  },
  {
    label: "Studio Tools",
    items: [
      { title: "Thumbnail Studio", url: "/thumbnails", icon: Image },
      { title: "Media Library", url: "/media", icon: Folder },
      { title: "Audio Effects", url: "/audio", icon: Music },
      { title: "Templates", url: "/templates", icon: LayoutTemplate },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Team", url: "/team", icon: Users },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
]

function NavItem({
  item,
  active,
  collapsed,
}: {
  item: { title: string; url: string; icon: React.ElementType }
  active: boolean
  collapsed: boolean
}) {
  const button = (
    <SidebarMenuButton
      asChild
      isActive={active}
      className="
        h-9 rounded-lg transition-all duration-150
        text-muted-foreground
        hover:bg-muted/60 hover:text-foreground
        data-[active=true]:bg-primary/10 data-[active=true]:text-primary
        data-[active=true]:font-semibold data-[active=true]:border-l-2
        data-[active=true]:border-primary data-[active=true]:pl-[calc(0.75rem-2px)]
      "
    >
      <Link href={item.url} className="flex items-center gap-3 px-3">
        <item.icon size={17} className="shrink-0" />
        <span className="text-sm truncate">{item.title}</span>
      </Link>
    </SidebarMenuButton>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.title}
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}

export function AppSidebar() {
  const { user } = useAuthStore()
  const pathname = usePathname()
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">

      {/* Logo Header */}
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/60">
        <Logo />
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-3 gap-0">
        {navGroups.map((group, groupIdx) => (
          <div key={group.label}>
            {groupIdx > 0 && (
              <Separator className="my-2 bg-border/50" />
            )}
            <SidebarGroup className="py-0">
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 py-2 h-auto">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.url || pathname.startsWith(item.url + "/")
                  return (
                    <SidebarMenuItem key={item.title}>
                      <NavItem item={item} active={active} collapsed={collapsed} />
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 border-t border-border/60">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserButton />
            {!collapsed && (
              <span className="text-sm font-medium truncate text-foreground/80">
                {user?.firstName
                  ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
                  : user?.email || "Account"}
              </span>
            )}
          </div>
          {!collapsed && <ThemeToggle />}
        </div>
      </SidebarFooter>

    </Sidebar>
  )
}