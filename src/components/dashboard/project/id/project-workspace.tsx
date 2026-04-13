"use client"
import { useProjectWorkspace } from "./use-project-workspace"
import { WorkspaceHeader } from "./workspace-header"
import { WorkspaceTabs } from "./workspace-tabs"

export function ProjectWorkspace() {
  const {
    project,
    isLoading,
    activeScript,
    generateScript,
    isGenerating,
  } = useProjectWorkspace()

  return (
    <div className="space-y-6">
      <WorkspaceHeader project={project} isLoading={isLoading} />

      <WorkspaceTabs
        activeScript={activeScript}
        onGenerate={generateScript}
        isGenerating={isGenerating}
      />
    </div>
  )
}