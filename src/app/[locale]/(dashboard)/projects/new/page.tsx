import type { Metadata } from "next"
import { getTranslations } from "@/i18n/server"

import { NewProjectWizard } from "@/features/projects/components/new-project-wizard"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("projects")
  return {
    title: t("metadata.newTitle"),
    description: t("metadata.newDescription"),
  }
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { returnTo } = await searchParams

  return <NewProjectWizard returnTo={returnTo === "projects" ? "projects" : undefined} />
}
