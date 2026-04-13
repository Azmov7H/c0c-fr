"use client"

import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

export function EmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="
      flex flex-col items-center justify-center
      text-center py-20
      border border-dashed rounded-2xl
      bg-muted/20
    ">

      <div className="
        w-14 h-14 mb-4
        flex items-center justify-center
        rounded-full bg-primary/10
      ">
        <Users className="w-6 h-6 text-primary" />
      </div>

      <h3 className="text-lg font-semibold">
        No Workspaces Yet
      </h3>

      <p className="text-muted-foreground max-w-sm mt-2 mb-6">
        Create your first workspace to start collaborating
        with your team.
      </p>

      {onCreate && (
        <Button onClick={onCreate}>
          Create Workspace
        </Button>
      )}

    </div>
  )
}