import type { Metadata } from "next"

import { NewProjectWizard } from "@/features/projects/components/new-project-wizard"

export const metadata: Metadata = {
  title: "New Project",
  description: "Create a project and seed it with the idea your scripts will grow from.",
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { returnTo } = await searchParams

  return <NewProjectWizard returnTo={returnTo === "projects" ? "projects" : undefined} />
}
