import { Skeleton } from "@/components/ui/skeleton"
import type { Project } from "@/types"

interface WorkspaceHeaderProps {
  project?: Project
  isLoading: boolean
}

export function WorkspaceHeader({ project, isLoading }: WorkspaceHeaderProps) {
  return (
    <div className="glass p-6 rounded-2xl">
      {isLoading ? (
        <Skeleton className="h-8 w-40" />
      ) : (
        <h1 className="text-2xl font-bold">
          {project?.title}
        </h1>
      )}
    </div>
  )
}