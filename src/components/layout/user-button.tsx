"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useAuthStore } from "@/store/auth-store"
import { useLogout } from "@/features/auth/hooks/use-auth"

export function UserButton() {
  const { user } = useAuthStore()
  const router = useRouter()
  const { mutate: logout, isPending } = useLogout()

  const initials = useMemo(() => {
    if (!user) return "U"
    return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
  }, [user])

  const handleLogout = () => {
    logout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none">
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

        <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
          disabled={isPending}
        >
          <LogOut className="mr-2 h-4 h-4" />
          {isPending ? "Signing out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
