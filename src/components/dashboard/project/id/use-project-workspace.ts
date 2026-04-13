"use client"
import { useProject } from "@/features/projects/hooks/use-projects"
import { useGenerateScript, useProjectScripts } from "@/features/scripts/hooks/use-scripts"
import { useParams } from "next/navigation"
import { useMemo } from "react"
export function useProjectWorkspace() {
  const { id } = useParams()

  const { data: project, isLoading, error } = useProject(id as string)
  const { data: scripts } = useProjectScripts(id as string)
  const { mutate, isPending } = useGenerateScript()

  const activeScript = useMemo(
    () => scripts?.[0] ?? null,
    [scripts]
  )

  return {
    project,
    isLoading,
    activeScript,
    generateScript: () => mutate(id as string),
    isGenerating: isPending,
    error
  }
}