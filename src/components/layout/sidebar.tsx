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
import Logo from "../logo"
import { ThemeToggle } from "../theme-toggle"
import { UserButtonSlot } from "./user-button-slot"
import { useAuthStore } from "@/store/auth-store"
import { NAV_GROUPS, getActiveNavUrl, type NavItem as NavConfigItem } from "@/lib/navigation"

function NavItem({
  item,
  active,
  collapsed,
}: {
  item: NavConfigItem
  active: boolean
  collapsed: boolean
}) {
  // T20: collapsed labels use the native title attribute. The Radix tooltip
  // here put Popper on every authenticated route's first-load path; the
  // browser tooltip needs no JavaScript and is announced as the accessible
  // name when the label is visually hidden by the icon rail.
  return (
    <SidebarMenuButton
      asChild
      isActive={active}
      className="
        h-9 max-md:h-11 rounded-lg transition-all duration-150
        text-muted-foreground
        hover:bg-muted/60 hover:text-foreground
        data-[active=true]:bg-primary/10 data-[active=true]:text-primary
        data-[active=true]:font-semibold data-[active=true]:border-l-2
        data-[active=true]:border-primary data-[active=true]:pl-[calc(0.75rem-2px)]
      "
    >
      <Link
        href={item.url}
        aria-current={active ? "page" : undefined}
        title={collapsed ? item.title : undefined}
        className="flex items-center gap-3 px-3"
      >
        <item.icon size={17} className="shrink-0" />
        <span className="text-sm truncate">{item.title}</span>
      </Link>
    </SidebarMenuButton>
  )
}

export function AppSidebar() {
  const { user } = useAuthStore()
  const pathname = usePathname()
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const activeUrl = getActiveNavUrl(pathname)

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">

      {/* Logo Header */}
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/60">
        <Logo />
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-3 gap-0">
        <nav aria-label="Primary" className="flex flex-col">
          {NAV_GROUPS.map((group, groupIdx) => (
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
                    const active = item.url === activeUrl
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
        </nav>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 border-t border-border/60">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserButtonSlot />
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
