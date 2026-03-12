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
} from "@/components/ui/sidebar"

import {
  LayoutDashboard,
  FolderKanban,
  Users,
  TrendingUp,
  Settings
} from "lucide-react"

import Logo from "../logo"
import { ThemeToggle } from "../theme-toggle"

const links = [
  {
    label: "Workspace",
    items: [
      { title: "Overview", url: "/overview", icon: LayoutDashboard },
      { title: "Projects", url: "/projects", icon: FolderKanban },
      { title: "Team", url: "/team", icon: Users },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "Trends", url: "/trends", icon: TrendingUp },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
]

export function AppSidebar() {

  const pathname = usePathname()

  return (

    <Sidebar collapsible="icon" className="border-r">

      {/* Header */}

      <SidebarHeader className="h-16 flex items-center px-4">
        <Logo />
      </SidebarHeader>

      {/* Content */}

      <SidebarContent className="px-2">

        {links.map((group) => (

          <SidebarGroup key={group.label}>

            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
              {group.label}
            </SidebarGroupLabel>

            <SidebarMenu>

              {group.items.map((item) => {

                const active = pathname.startsWith(item.url)

                return (

                  <SidebarMenuItem key={item.title}>

                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="
                      h-10
                      rounded-lg
                      transition-colors
                      data-[active=true]:bg-accent
                      data-[active=true]:text-accent-foreground
                      "
                    >

                      <Link
                        href={item.url}
                        className="flex items-center gap-3"
                      >
                        <item.icon size={18} />
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>

                )
              })}

            </SidebarMenu>

          </SidebarGroup>

        ))}

      </SidebarContent>

      {/* Footer */}

      <SidebarFooter className="p-3 border-t">

        <div className="flex items-center justify-between">

          <span className="text-sm text-muted-foreground">
            Theme
          </span>

          <ThemeToggle />

        </div>

      </SidebarFooter>

    </Sidebar>

  )
}