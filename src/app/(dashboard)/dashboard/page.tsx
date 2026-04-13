import type { Metadata } from "next"
import { DashboardView } from "@/features/dashboard/components/dashboard-view"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your content creation workspace — projects, scripts, and performance metrics.",
}

export default function DashboardPage() {
  return <DashboardView />
}
