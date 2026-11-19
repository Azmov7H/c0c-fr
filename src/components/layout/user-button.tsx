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
import { useTranslations } from "next-intl"
import { useTheme } from "@/components/theme-provider"
import { useAuthStore } from "@/store/auth-store"
import { useLogout } from "@/features/auth/hooks/use-auth"

export function UserButton() {
  const { user } = useAuthStore()
  const router = useRouter()
  // AR-029 — the account menu's words come from the `navigation` catalog.
  const t = useTranslations("navigation")
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
          aria-label={t("userMenu.accountMenu")}
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
          <User className="me-2 h-4 w-4" />
          {t("userMenu.profile")}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="me-2 h-4 w-4" />
          {t("userMenu.accountSettings")}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/settings/billing")}>
          <CreditCard className="me-2 h-4 w-4" />
          {t("userMenu.billingPlan")}
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoon className="me-2 h-4 w-4" />
            {t("userMenu.theme")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun className="me-2 h-4 w-4" />
                {t("userMenu.light")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="me-2 h-4 w-4" />
                {t("userMenu.dark")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor className="me-2 h-4 w-4" />
                {t("userMenu.system")}
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
          <LogOut className="me-2 h-4 w-4" />
          {isPending ? t("userMenu.signingOut") : t("userMenu.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
