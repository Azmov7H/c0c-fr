"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreditCard, LogOut, Monitor, Moon, Settings, Sun, SunMoon, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useTheme } from "@/components/theme-provider"
import { useAuthStore } from "@/store/auth-store"
import { useLogout } from "@/features/auth/hooks/use-auth"

export function UserButton() {
  const { user } = useAuthStore()
  const router = useRouter()
  const { mutate: logout, isPending } = useLogout()
  const { theme, setTheme } = useTheme()

  const initials = useMemo(() => {
    if (!user) return "U"
    return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
  }, [user])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="
            flex items-center justify-center rounded-full outline-none
            size-9 max-md:size-11
            focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
          "
          aria-label="Account menu"
          aria-haspopup="menu"
        >
          <Avatar className="h-9 w-9 border border-border transition hover:scale-105">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 rounded-xl shadow-premium"
      >
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* /settings/profile never existed — 404 for everyone until T10. */}
        <DropdownMenuItem onClick={() => router.push("/settings?tab=profile")}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Account settings
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/settings/billing")}>
          <CreditCard className="mr-2 h-4 w-4" />
          Billing &amp; Plan
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoon className="mr-2 h-4 w-4" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => logout()}
          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
          disabled={isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
