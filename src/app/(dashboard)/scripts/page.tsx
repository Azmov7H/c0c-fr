import type { Metadata } from "next"
import { ScriptGenerator } from "@/features/scripts/components/script-generator"

export const metadata: Metadata = {
  title: "Script Generator",
  description: "Generate AI-powered video scripts with platform-specific formatting and tone control.",
}

export default function ScriptsPage() {
  return <ScriptGenerator />
}
