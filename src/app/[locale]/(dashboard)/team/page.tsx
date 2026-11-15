import type { Metadata } from "next"
import { TeamManagement } from "@/features/teams/components/team-management"

export const metadata: Metadata = {
  title: "Team",
  description: "Manage your team members, workspaces, and collaboration settings.",
}

export default function TeamPage() {
  return <TeamManagement />
}
