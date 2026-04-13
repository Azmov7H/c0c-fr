import { Skeleton } from "@/components/ui/skeleton"
export function WorkspaceHeader({ project, isLoading }: any) {
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