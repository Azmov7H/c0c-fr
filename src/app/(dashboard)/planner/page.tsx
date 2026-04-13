import type { Metadata } from "next"
import { ContentPlanner } from "@/features/planner/components/content-planner"

export const metadata: Metadata = {
  title: "Content Planner",
  description: "Plan and schedule your content calendar with AI-assisted scheduling.",
}

export default function PlannerPage() {
  return <ContentPlanner />
}
