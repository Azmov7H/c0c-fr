import type { Metadata } from "next"
import { getTranslations } from "@/i18n/server"
import { SettingsDashboard } from "@/features/settings/components/settings-dashboard"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings")
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  }
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  return <SettingsDashboard defaultTab={tab} />
}
