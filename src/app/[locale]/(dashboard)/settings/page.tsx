import type { Metadata } from "next"
import { SettingsDashboard } from "@/features/settings/components/settings-dashboard"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, workspace configuration, and preferences.",
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  return <SettingsDashboard defaultTab={tab} />
}
