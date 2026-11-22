import type { Metadata } from "next"
import { Suspense } from "react"
import { getTranslations } from "@/i18n/server"

import { ProjectsView } from "@/features/projects/components/projects-view"
import { ProjectGridSkeleton } from "@/features/projects/components/projects-skeletons"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("projects")
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  }
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectGridSkeleton />}>
      <ProjectsView />
    </Suspense>
  )
}
