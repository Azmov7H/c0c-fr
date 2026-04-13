"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="
        relative w-9 h-9 rounded-full
        transition-all duration-300
        hover:bg-muted
      "
      aria-label="Toggle theme"
    >
      <Sun
        className="
          h-4 w-4 transition-all
          rotate-0 scale-100
          dark:-rotate-90 dark:scale-0
        "
      />

      <Moon
        className="
          absolute h-4 w-4 transition-all
          rotate-90 scale-0
          dark:rotate-0 dark:scale-100
        "
      />
    </Button>
  )
}