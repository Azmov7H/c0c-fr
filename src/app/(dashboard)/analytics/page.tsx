import type { Metadata } from "next"
import { AnalyticsDashboard } from "@/features/analytics/components/analytics-dashboard"

export const metadata: Metadata = {
  title: "Analytics",
  description: "Track content performance across platforms with detailed analytics and insights.",
}

export default function AnalyticsPage() {
  return <AnalyticsDashboard />
}
