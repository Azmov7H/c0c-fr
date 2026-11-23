import type { Metadata } from "next"
import { getTranslations } from "@/i18n/server"
import { TeamManagement } from "@/features/teams/components/team-management"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("team")
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  }
}

export default function TeamPage() {
  return <TeamManagement />
}
