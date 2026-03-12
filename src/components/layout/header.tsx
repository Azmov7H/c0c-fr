"use client"

import React from "react"
import { UserButton } from "./user-button"

import { Search, Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function Header() {

  return (

    <header className="
      sticky
      top-0
      z-40
      flex
      h-16
      items-center
      justify-between
      border-b
      bg-background/80
      backdrop-blur
      px-4
      md:px-8
    ">

      {/* Left section */}

      <div className="flex items-center gap-4 flex-1">

        {/* Mobile sidebar button */}

        <SidebarTrigger className="md:hidden" />

        {/* Search */}

        <Button
          variant="outline"
          className="
            hidden
            md:flex
            h-9
            w-full
            max-w-sm
            items-center
            justify-between
            gap-2
            rounded-lg
            bg-muted/40
            text-muted-foreground
            hover:bg-muted
            font-normal
          "
        >

          <div className="flex items-center gap-2">

            <Search className="w-4 h-4" />

            <span className="text-sm">
              Search workspace...
            </span>

          </div>

          <kbd className="
            hidden
            lg:inline-flex
            h-5
            items-center
            rounded
            border
            bg-background
            px-1.5
            text-[10px]
            font-mono
          ">
            ⌘ K
          </kbd>

        </Button>

      </div>

      {/* Right section */}

      <div className="flex items-center gap-2">

        {/* Notifications */}

        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
        >

          <Bell className="w-5 h-5" />

          <span className="
            absolute
            right-2
            top-2
            h-2
            w-2
            rounded-full
            bg-primary
          " />

        </Button>

        {/* Divider */}

        <div className="hidden sm:block h-6 w-px bg-border mx-2" />

        {/* User menu */}

        <UserButton />

      </div>

    </header>

  )
}