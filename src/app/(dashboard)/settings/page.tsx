import type { Metadata } from "next"
import { SettingsDashboard } from "@/features/settings/components/settings-dashboard"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, workspace configuration, and preferences.",
}

export default function SettingsPage() {
  return <SettingsDashboard />
}
