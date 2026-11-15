import type { Metadata } from "next"
import { Suspense } from "react"

import { ProjectsView } from "@/features/projects/components/projects-view"
import { ProjectGridSkeleton } from "@/features/projects/components/projects-skeletons"

export const metadata: Metadata = {
  title: "Projects",
  description: "Manage your AI content projects, scripts, and workflows.",
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectGridSkeleton />}>
      <ProjectsView />
    </Suspense>
  )
}
