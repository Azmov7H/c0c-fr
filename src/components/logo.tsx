import React from "react"
import { Cpu } from "lucide-react"
export default function Logo() {
  return (

    <div className="flex items-center gap-3 px-2 group">

      {/* Icon */}

      <div className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-lg
        bg-gradient-to-br
        from-primary
        to-purple-500
        text-white
        shadow-sm
      ">
        <Cpu className="h-4 w-4" />
      </div>

      {/* Text */}

      <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">

        <span className="text-sm font-semibold tracking-tight">
          C0C AI
        </span>

        <span className="text-xs text-muted-foreground">
          Content Engine
        </span>

      </div>

    </div>

  )
}