import type { Metadata } from "next"
import { ProjectsView } from "@/features/projects/components/projects-view"

export const metadata: Metadata = {
  title: "Projects",
  description: "Manage your AI content projects, scripts, and workflows.",
}

export default function ProjectsPage() {
  return <ProjectsView />
}